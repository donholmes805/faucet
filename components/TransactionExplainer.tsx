import React, { useState } from 'react';
import GeminiResponse from './GeminiResponse';

const TransactionExplainer: React.FC = () => {
    const [hash, setHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [explanation, setExplanation] = useState('');

    const handleExplain = async () => {
        if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
            setError('Please enter a valid transaction hash (0x...).');
            return;
        }
        setError('');
        setExplanation('');
        setLoading(true);

        try {
            const response = await fetch('/api/explain-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: hash }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get explanation.');
            }
            setExplanation(data.explanation);

        } catch (e: any) {
            console.error("Explanation failed:", e);
            setError(e.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-fito-bg-light rounded-2xl p-8 shadow-2xl w-full max-w-4xl mx-auto border border-fito-border">
            <h2 className="text-2xl font-bold text-white mb-2">Transaction Explainer</h2>
            <p className="text-fito-text-dark mb-6">Enter a transaction hash to get an AI-powered explanation of its purpose and components.</p>

            <div className="space-y-4">
                <input
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    placeholder="Enter transaction hash (e.g., 0x...)"
                    className="w-full bg-fito-bg border border-fito-border text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-fito-green focus:outline-none transition-all"
                    disabled={loading}
                    aria-label="Transaction hash"
                />

                <button
                    onClick={handleExplain}
                    disabled={loading || !hash}
                    className="w-full bg-fito-green hover:bg-fito-green-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-fito-panel disabled:text-fito-text-dark disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading"></div>}
                    {loading ? 'Explaining...' : 'Explain Transaction'}
                </button>
                
                <GeminiResponse loading={loading} error={error} response={explanation} />
            </div>
        </div>
    );
};

export default TransactionExplainer;
