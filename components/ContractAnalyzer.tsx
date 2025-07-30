import React, { useState } from 'react';
import GeminiResponse from './GeminiResponse';

const ContractAnalyzer: React.FC = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState('');

    const handleAnalyze = async () => {
        if (code.trim().length < 50) {
            setError('Please enter a reasonable amount of contract code to analyze.');
            return;
        }
        setError('');
        setAnalysis('');
        setLoading(true);

        try {
            const response = await fetch('/api/analyze-contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get analysis.');
            }
            setAnalysis(data.analysis);

        } catch (e: any) {
            console.error("Analysis failed:", e);
            setError(e.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-fito-bg-light rounded-2xl p-8 shadow-2xl w-full max-w-4xl mx-auto border border-fito-border">
            <h2 className="text-2xl font-bold text-white mb-2">Smart Contract Analyzer</h2>
            <p className="text-fito-text-dark mb-6">Paste your smart contract code below for an AI-driven analysis of potential issues and logic summary.</p>

            <div className="space-y-4">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your Solidity code here..."
                    className="w-full h-64 bg-fito-bg border border-fito-border text-white rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-fito-green focus:outline-none transition-all resize-y"
                    disabled={loading}
                    aria-label="Smart contract code"
                />

                <button
                    onClick={handleAnalyze}
                    disabled={loading || !code}
                    className="w-full bg-fito-green hover:bg-fito-green-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-fito-panel disabled:text-fito-text-dark disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading"></div>}
                    {loading ? 'Analyzing...' : 'Analyze Contract'}
                </button>
                
                <GeminiResponse loading={loading} error={error} response={analysis} />
            </div>
        </div>
    );
};

export default ContractAnalyzer;
