// This file represents a serverless function endpoint (e.g., /api/faucet).
// It must be deployed in an environment that can run Node.js.
//
// IMPORTANT: You must set the following environment variables in your deployment environment:
// - FAUCET_PRIVATE_KEY: The private key of the wallet that will send the FITO tokens.
// - FITOCHAIN_RPC_URL: The RPC URL for the Fitochain network (e.g., https://rpc.fitochain.com).
// - UPSTASH_REDIS_REST_URL: The REST URL for your Upstash Redis instance.
// - UPSTASH_REDIS_REST_TOKEN: The access token for your Upstash Redis instance.

import { ethers } from 'ethers';
import { Redis } from '@upstash/redis/vercell';

// --- Faucet Configuration ---
const FAUCET_AMOUNT_WEI = ethers.parseEther("500");
const COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

let redis: Redis;

function getRedisClient() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis environment variables are not set.");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}


/**
 * A simplified serverless function handler.
 * Your cloud provider (Vercel, Netlify, etc.) might have a specific signature.
 */
export default async function handler(req: Request): Promise<Response> {
  // Allow CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { address } = await req.json();

    if (!ethers.isAddress(address)) {
      return new Response(JSON.stringify({ error: 'Invalid address provided' }), { status: 400, headers });
    }

    const redisClient = getRedisClient();
    const normalizedAddress = address.toLowerCase();
    const cooldownKey = `faucet-cooldown:${normalizedAddress}`;

    // Check Cooldown from persistent Upstash store
    const lastClaimTimestamp = await redisClient.get<number>(cooldownKey);
    if (lastClaimTimestamp) {
      const remaining = COOLDOWN_PERIOD_MS - (Date.now() - lastClaimTimestamp);
      if (remaining > 0) {
        return new Response(JSON.stringify({
          error: `Address is on cooldown.`,
          cooldownRemaining: remaining,
        }), { status: 429, headers });
      }
    }

    const privateKey = process.env.FAUCET_PRIVATE_KEY;
    const rpcUrl = process.env.FITOCHAIN_RPC_URL;

    if (!privateKey || !rpcUrl) {
      console.error("Server configuration error: Missing FAUCET_PRIVATE_KEY or FITOCHAIN_RPC_URL");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Check if the faucet has enough funds
    const balance = await provider.getBalance(wallet.address);
    if (balance < FAUCET_AMOUNT_WEI) {
      console.warn(`Faucet is empty. Current balance: ${ethers.formatEther(balance)} FITO.`);
      return new Response(JSON.stringify({ error: 'Faucet is currently empty. Please try again later.' }), { status: 503, headers });
    }
    
    const tx = await wallet.sendTransaction({
      to: address,
      value: FAUCET_AMOUNT_WEI,
    });
    
    console.log(`Sent ${ethers.formatEther(FAUCET_AMOUNT_WEI)} FITO to ${address}. Tx: ${tx.hash}`);
    
    // Set new cooldown timestamp in Upstash store, with expiration for automatic cleanup.
    await redisClient.set(cooldownKey, Date.now(), { ex: Math.floor(COOLDOWN_PERIOD_MS / 1000) });

    return new Response(JSON.stringify({ txHash: tx.hash }), { status: 200, headers });
    
  } catch (error) {
    console.error("Faucet execution failed:", error);
    if (error instanceof Error && error.message.includes("Upstash")) {
       return new Response(JSON.stringify({ error: 'Could not connect to the storage service. Please check server configuration.' }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ error: 'Transaction failed. The faucet might be empty or the network is busy.' }), { status: 500, headers });
  }
}