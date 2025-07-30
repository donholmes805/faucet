import { GoogleGenAI, Chat } from "@google/genai";
import type { ApiChatMessage } from '../types';

export default async function handler(req: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { message, history } = await req.json() as { message: string; history: ApiChatMessage[] };

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'A valid message is required.' }), { status: 400, headers });
    }
    if (!Array.isArray(history)) {
        return new Response(JSON.stringify({ error: 'A valid history array is required.' }), { status: 400, headers });
    }
    
    if (!process.env.API_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY is not set.' }), { status: 500, headers });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `
            You are a helpful and friendly AI assistant for Fitochain, a fictional blockchain platform. 
            Your primary goal is to assist developers by answering their questions about building on Fitochain. 
            Assume Fitochain is similar to Ethereum, using Solidity for smart contracts and a compatible JSON-RPC API.
            Answer questions clearly and provide code examples in markdown when helpful.
            If you don't know an answer, say so honestly. Do not make up information about Fitochain-specific tools or libraries that don't exist.
            Stick to general blockchain development advice in the context of a Fitochain query.
        `,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message });
    
    return new Response(JSON.stringify({ response: response.text }), { status: 200, headers });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    return new Response(JSON.stringify({ error: 'Failed to get response from AI chat service.' }), { status: 500, headers });
  }
}
