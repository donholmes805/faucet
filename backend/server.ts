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

// --- Service Initialization ---
// We wrap initialization in a function to clearly separate setup from the Express app logic.
// This also contains all dependencies so it's clear what's needed.
function initializeServices() {
    const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
    const TESTNET_RPC_URL = process.env.TESTNET_RPC_URL;
    const API_KEY = process.env.API_KEY;

    if (!FAUCET_PRIVATE_KEY || !TESTNET_RPC_URL || !API_KEY) {
        const errorMsg = "Missing required environment variables. Ensure FAUCET_PRIVATE_KEY, TESTNET_RPC_URL, and API_KEY are set in the server environment.";
        console.error(`[FATAL] Faucet initialization failed: ${errorMsg}`);
        return { error: errorMsg };
    }

    try {
        const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
        const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const FAUCET_SEND_AMOUNT = process.env.FAUCET_SEND_AMOUNT || '1000';
        
        console.log(`Faucet services initialized successfully. Wallet address: ${wallet.address}`);
        return { provider, wallet, ai, FAUCET_SEND_AMOUNT, error: null };
    } catch (e: any) {
        const errorMsg = `Failed to initialize services: ${e.message}`;
        console.error(`[FATAL] Faucet initialization failed during service setup:`, e);
        return { error: errorMsg };
    }
}

const { provider, wallet, ai, FAUCET_SEND_AMOUNT, error: initError } = initializeServices();
// --- End Service Initialization ---


// In-memory store for rate limiting. For production, a database like Redis is recommended.
const requestTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

// Middleware to check if services initialized correctly.
// This prevents any route from running if the server isn't configured.
const serviceCheckMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (initError || !ai || !wallet || !provider) {
        // Log the specific error on the server for easier debugging.
        console.error(`Service check failed for request to ${req.path}: ${initError}`);
        return res.status(503).json({ message: 'The faucet is temporarily unavailable due to a server configuration error.' });
    }
    next();
};

// A health check endpoint that doesn't use the serviceCheck middleware,
// so we can diagnose the server status even if services are down.
app.get('/api/health', (req: express.Request, res: express.Response) => {
    if (initError) {
        return res.status(503).json({ status: 'error', message: initError });
    }
    res.status(200).json({ status: 'ok', wallet: wallet?.address });
});

// All functional routes are protected by the middleware.
app.get('/api/captcha-question', serviceCheckMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const response = await ai!.models.generateContent({
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

app.post('/api/request-tokens', serviceCheckMiddleware, async (req: express.Request, res: express.Response) => {
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
    const response = await ai!.models.generateContent({
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
    const amount = ethers.parseEther(FAUCET_SEND_AMOUNT!);
    
    const tx = await wallet!.sendTransaction({
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
        if (initError) {
            console.error(`[ERROR] Faucet backend cannot start properly. See error above.`);
        } else {
            console.log(`Faucet backend server running on http://localhost:${PORT}`);
        }
    });
}

export default app;
