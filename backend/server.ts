import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
const TESTNET_RPC_URL = process.env.TESTNET_RPC_URL;
const FAUCET_SEND_AMOUNT = process.env.FAUCET_SEND_AMOUNT || '1000'; // Amount in FITO

if (!FAUCET_PRIVATE_KEY || !TESTNET_RPC_URL || !process.env.API_KEY) {
  throw new Error("Missing required environment variables: FAUCET_PRIVATE_KEY, TESTNET_RPC_URL, or API_KEY");
}

const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// In-memory store for rate limiting. For production, a database like Redis is recommended.
const requestTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/captcha-question', async (req: express.Request, res: express.Response) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a simple and short CAPTCHA-style question that most humans can answer easily. The answer should be a single word or number.
      Examples:
      - "What color is a banana?"
      - "What is 5 + 8?"
      - "Which animal says 'woof'?"
      - "How many days are in a week?"
      Do not include the answer in your response. Only provide the question text.`,
      config: {
        temperature: 1, // Be creative with questions
      }
    });
    const question = response.text.trim().replace(/"/g, ''); // Clean up potential quotes
    res.status(200).json({ question });
  } catch (error) {
    console.error('Error generating CAPTCHA question:', error);
    res.status(500).json({ message: 'Could not generate a CAPTCHA question. Please try again.' });
  }
});

app.post('/api/request-tokens', async (req: express.Request, res: express.Response) => {
  const { address, question, userAnswer } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ message: 'Invalid wallet address provided.' });
  }
  if (!question || !userAnswer) {
    return res.status(400).json({ message: 'CAPTCHA validation failed. Please answer the question.' });
  }

  // Step 1: Verify CAPTCHA answer with Gemini
  try {
    const verificationPrompt = `Is "${userAnswer}" a correct answer for the question "${question}"? Consider common variations but be strict with math. Answer with only "true" or "false".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: verificationPrompt,
        config: { temperature: 0 } // Be deterministic for verification
    });
    
    const isCorrect = response.text.trim().toLowerCase() === 'true';

    if (!isCorrect) {
      return res.status(400).json({ message: 'Incorrect CAPTCHA answer. Please try again.' });
    }
  } catch(error) {
      console.error('Error verifying CAPTCHA answer:', error);
      return res.status(500).json({ message: 'Could not verify your answer. Please try again.' });
  }

  // Step 2: Check rate limit
  const userAddress = address.toLowerCase();
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(userAddress);

  if (lastRequestTime && (now - lastRequestTime < RATE_LIMIT_MS)) {
    const timeRemaining = RATE_LIMIT_MS - (now - lastRequestTime);
    const hoursRemaining = (timeRemaining / (1000 * 60 * 60)).toFixed(1);
    return res.status(429).json({ message: `Rate limit: Please try again in ${hoursRemaining} hours.` });
  }
  
  // Step 3: Send tokens
  try {
    console.log(`Sending ${FAUCET_SEND_AMOUNT} FITO to ${address}...`);
    const amount = ethers.parseEther(FAUCET_SEND_AMOUNT);
    
    const tx = await wallet.sendTransaction({
      to: address,
      value: amount,
    });
    
    console.log(`Transaction sent! Hash: ${tx.hash}`);

    // Wait for the transaction to be mined to give the user confirmation
    await tx.wait(); 
    console.log(`Transaction confirmed: ${tx.hash}`);

    requestTimestamps.set(userAddress, now);

    res.status(200).json({ txHash: tx.hash });

  } catch (error: any) {
    console.error(`Failed to send transaction to ${address}:`, error);
    res.status(500).json({ message: 'An error occurred while sending the transaction. Please try again later.' });
  }
});

// This listen block is for local development. Vercel handles this automatically.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Faucet backend server running on port ${PORT}`);
        console.log(`Faucet wallet address: ${wallet.address}`);
    });
}

export default app;