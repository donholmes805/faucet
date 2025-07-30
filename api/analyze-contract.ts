import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string' || code.length < 20) {
      return new Response(JSON.stringify({ error: 'Valid smart contract code must be provided.' }), { status: 400, headers });
    }
    
    if (!process.env.API_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY is not set.' }), { status: 500, headers });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
        You are an expert smart contract security auditor and code reviewer specializing in Solidity. 
        Your task is to analyze the provided smart contract code.
        
        Provide your analysis in three sections using markdown:
        
        ### 1. Overall Summary
        Briefly describe the contract's main purpose and functionality.
        
        ### 2. Security Analysis
        Identify potential vulnerabilities (e.g., reentrancy, integer overflow/underflow, access control issues). 
        For each finding, explain the risk and suggest a mitigation. If no major issues are found, state that.
        
        ### 3. Code Quality & Optimizations
        Suggest improvements for gas efficiency, code clarity, and adherence to best practices.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: code,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    
    return new Response(JSON.stringify({ analysis: response.text }), { status: 200, headers });

  } catch (error) {
    console.error("Error in /api/analyze-contract:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate analysis from AI service.' }), { status: 500, headers });
  }
}
