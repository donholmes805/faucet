import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { txHash } = await req.json();

    if (!txHash || typeof txHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return new Response(JSON.stringify({ error: 'Invalid transaction hash provided' }), { status: 400, headers });
    }
    
    if (!process.env.API_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY is not set.' }), { status: 500, headers });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      As a blockchain expert, explain the following transaction hash in simple, easy-to-understand terms. 
      You don't have real-time access to the blockchain, so base your explanation on the typical structure and purpose of a transaction.
      
      Explain what this hash represents and break down the common components of a transaction it might point to, such as:
      - Sender (From)
      - Receiver (To)
      - Value / Amount
      - Gas Fees / Transaction Cost
      - Contract Interaction (if applicable)
      
      Keep the language clear and accessible for someone new to blockchain. Use markdown for formatting.
      
      Transaction Hash: ${txHash}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return new Response(JSON.stringify({ explanation: response.text }), { status: 200, headers });

  } catch (error) {
    console.error("Error in /api/explain-tx:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate explanation from AI service.' }), { status: 500, headers });
  }
}
