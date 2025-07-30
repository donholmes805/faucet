import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ApiChatMessage } from '../types';
import GeminiResponse from './GeminiResponse';
import { FitoLogo, ErrorIcon } from './icons';

const FitochainQABot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! I'm the Fitochain AI assistant. How can I help you with your development questions today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);
    
    const transformHistoryForApi = (history: ChatMessage[]): ApiChatMessage[] => {
        return history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setError('');
        setLoading(true);

        // Prepare history, excluding the last user message which is the new prompt
        const historyForApi = transformHistoryForApi(messages);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history: historyForApi }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'API error');

            const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
            setMessages([...newMessages, assistantMessage]);

        } catch (e: any) {
            setError(e.message || 'Failed to get a response.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-fito-bg-light rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border border-fito-border flex flex-col" style={{height: '70vh'}}>
             <h2 className="text-xl font-bold text-white p-4 border-b border-fito-border">Fitochain Q&A Bot</h2>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && <FitoLogo className="w-8 h-8 flex-shrink-0 text-fito-green" />}
                        <div className={`rounded-lg px-4 py-2 max-w-lg ${msg.role === 'user' ? 'bg-fito-green text-white' : 'bg-fito-panel text-fito-text'}`}>
                             <GeminiResponse response={msg.content} loading={false} error="" isStreaming={true} />
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <FitoLogo className="w-8 h-8 flex-shrink-0 text-fito-green" />
                        <div className="rounded-lg px-4 py-2 max-w-lg bg-fito-panel text-fito-text">
                           <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-fito-text-dark rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                               <div className="w-2 h-2 bg-fito-text-dark rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                               <div className="w-2 h-2 bg-fito-text-dark rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-fito-border">
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg mb-4" role="alert">
                        <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about Fitochain development..."
                        className="flex-grow bg-fito-bg border border-fito-border text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-fito-green focus:outline-none transition-all"
                        disabled={loading}
                        aria-label="Chat message"
                    />
                    <button type="submit" disabled={loading || !input.trim()} className="bg-fito-green hover:bg-fito-green-dark text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-fito-panel disabled:text-fito-text-dark disabled:cursor-not-allowed">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FitochainQABot;
