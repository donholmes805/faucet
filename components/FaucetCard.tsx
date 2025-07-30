import React, { useState, useEffect } from 'react';
import { FAUCET_AMOUNT, EXPLORER_URL, API_ENDPOINT } from '../constants';
import type { FaucetSuccessResponse, FaucetErrorResponse } from '../types';
import { CopyIcon, CheckIcon, ErrorIcon } from './icons';

const FaucetCard: React.FC = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successTxHash, setSuccessTxHash] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);
  
  const handleCopy = () => {
    if (!successTxHash) return;
    navigator.clipboard.writeText(successTxHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequest = async () => {
    setError('');
    setSuccessTxHash('');
    setCooldownTime(0);

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Please enter a valid Fitochain address (0x...).');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data: FaucetSuccessResponse | FaucetErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as FaucetErrorResponse;
        setError(errorData.error || 'An unknown error occurred.');
        if (errorData.cooldownRemaining) {
          setCooldownTime(errorData.cooldownRemaining);
        }
        return;
      }

      const successData = data as FaucetSuccessResponse;
      setSuccessTxHash(successData.txHash);
      setAddress(''); // Clear input on success
      
    } catch (e) {
      console.error("Faucet request failed:", e);
      setError('Failed to connect to the faucet service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const isDisabled = loading || !address || cooldownTime > 0;

  return (
    <div className="bg-fito-bg-light rounded-2xl p-8 shadow-2xl w-full max-w-2xl mx-auto border border-fito-border">
      <h2 className="text-2xl font-bold text-white mb-2">Get Testnet FITO</h2>
      <p className="text-fito-text-dark mb-6">Receive {FAUCET_AMOUNT} FITO every 24 hours for testing on the Fitochain network.</p>
      
      <div className="space-y-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your Fitochain wallet address"
          className="w-full bg-fito-bg border border-fito-border text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-fito-green focus:outline-none transition-all"
          disabled={loading}
          aria-label="Fitochain wallet address"
          aria-describedby="error-message success-message"
        />
        
        {error && (
          <div id="error-message" className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg" role="alert">
            <ErrorIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {successTxHash && (
          <div id="success-message" className="bg-fito-green/10 border border-fito-green/50 rounded-lg p-4 text-sm text-fito-text" role="alert">
            <p className="font-bold text-fito-green mb-2">Success!</p>
            <p className="mb-3">We've sent {FAUCET_AMOUNT} FITO to your wallet.</p>
            <div className="flex items-center gap-3 bg-fito-bg p-2 rounded-md">
              <span className="font-mono text-xs text-fito-text-dark break-all">{successTxHash}</span>
              <button onClick={handleCopy} className="ml-auto p-1 text-fito-text-dark hover:text-white transition-colors flex-shrink-0" aria-label="Copy transaction hash">
                {copied ? <CheckIcon className="w-5 h-5 text-fito-green" /> : <CopyIcon className="w-5 h-5" />}
              </button>
            </div>
            <a href={`${EXPLORER_URL}/tx/${successTxHash}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-fito-green underline-offset-4 hover:underline text-xs">
              View on Explorer &rarr;
            </a>
          </div>
        )}
        
        <button
          onClick={handleRequest}
          disabled={isDisabled}
          className="w-full bg-fito-green hover:bg-fito-green-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-fito-panel disabled:text-fito-text-dark disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading"></div>}
          {loading 
              ? 'Sending...' 
              : cooldownTime > 0 
                ? `On Cooldown (${formatTime(cooldownTime)})` 
                : 'Send Me FITO'
          }
        </button>
      </div>
    </div>
  );
};

export default FaucetCard;