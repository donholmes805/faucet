export interface FaucetSuccessResponse {
  txHash: string;
}

export interface FaucetErrorResponse {
  error: string;
  cooldownRemaining?: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ApiChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}
