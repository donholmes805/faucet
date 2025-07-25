import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { requestTokens, getCaptchaQuestion } from '../services/faucetService';
import { FAUCET_TOKEN_AMOUNT, FAUCET_TOKEN_SYMBOL, TESTNET_NAME, RATE_LIMIT_HOURS } from '../constants';
import { NotificationState, NotificationType } from '../types';
import Notification from './Notification';
import ConnectWalletButton from './ConnectWalletButton';
import { SendIcon, WalletIcon, ExclamationTriangleIcon } from './Icon';

const FaucetCard: React.FC = () => {
  const { address, connectWallet, error: walletError, isConnecting, isWrongNetwork, switchOrAddNetwork } = useWallet();
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState<string>('');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState(false);

  const fetchQuestion = useCallback(async () => {
    setIsCaptchaLoading(true);
    setNotification(null);
    setCaptchaError(false);
    try {
      const question = await getCaptchaQuestion();
      setCaptchaQuestion(question);
    } catch (error) {
      console.error("Failed to fetch CAPTCHA question", error);
      const errorMessage = error instanceof Error ? error.message : 'Could not load question.';
      setCaptchaQuestion(`Error: ${errorMessage} Please refresh.`);
    } finally {
      setIsCaptchaLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);


  const handleRequestTokens = useCallback(async () => {
    if (!address || !captchaQuestion || isCaptchaLoading) return;

    setIsLoading(true);
    setNotification(null);
    setCaptchaError(false);

    try {
      const result = await requestTokens(address, captchaQuestion, userAnswer);
      setNotification({
        type: NotificationType.Success,
        message: `Successfully sent ${FAUCET_TOKEN_AMOUNT} ${FAUCET_TOKEN_SYMBOL} to your wallet!`,
        hash: result.txHash,
      });
      // Fetch a new question for the next time
      fetchQuestion();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setNotification({
        type: NotificationType.Error,
        message: errorMessage,
      });
      // If the answer was wrong, fetch a new question and show input error.
      if (errorMessage.toLowerCase().includes('captcha') || errorMessage.toLowerCase().includes('incorrect')) {
        setCaptchaError(true);
        fetchQuestion();
      }
    } finally {
      setIsLoading(false);
      setUserAnswer('');
    }
  }, [address, captchaQuestion, userAnswer, fetchQuestion, isCaptchaLoading]);

  const isButtonDisabled = !address || !userAnswer.trim() || isLoading || isWrongNetwork || isCaptchaLoading;

  return (
    <div className="w-full max-w-lg bg-gray-50 border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Get Testnet {FAUCET_TOKEN_SYMBOL}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Get {FAUCET_TOKEN_AMOUNT} {FAUCET_TOKEN_SYMBOL} every {RATE_LIMIT_HOURS} hours for the {TESTNET_NAME}.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {isWrongNetwork && (
            <div className="rounded-md bg-yellow-100 p-4 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Wrong Network Detected</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your wallet is not connected to the {TESTNET_NAME}.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={switchOrAddNetwork}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-100 focus:ring-yellow-500"
                    >
                      Switch to {TESTNET_NAME}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Wallet Address</label>
            {address ? (
              <div className="flex items-center w-full p-3 bg-white border border-gray-300 rounded-lg">
                <WalletIcon className="h-5 w-5 text-gray-600 mr-3 shrink-0" />
                <span className="text-sm text-gray-800 truncate font-mono">{address}</span>
              </div>
            ) : (
              <ConnectWalletButton connectWallet={connectWallet} isLoading={isConnecting} />
            )}
            {walletError && <p className="text-xs text-red-600 mt-1">{walletError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="bot-check" className="text-sm font-medium text-gray-800">Anti-Bot Verification</label>
            <div className="min-h-[20px] flex items-center">
              {isCaptchaLoading ? (
                <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
              ) : (
                <p className="text-sm text-gray-600">{captchaQuestion}</p>
              )}
            </div>
            <input
              id="bot-check"
              type="text"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                if(notification) setNotification(null);
                if(captchaError) setCaptchaError(false);
              }}
              placeholder="Your answer"
              className={`w-full p-3 bg-white border rounded-lg transition text-gray-900 placeholder:text-gray-400 ${
                captchaError
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
              }`}
              aria-describedby="bot-check-description"
              disabled={isWrongNetwork || isCaptchaLoading}
            />
          </div>
          
          <div>
            <button
              onClick={handleRequestTokens}
              disabled={isButtonDisabled}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-900"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                 <SendIcon className="h-5 w-5 mr-2"/>
                  Request Tokens
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {notification && (
        <div className="p-6 sm:p-8 pt-0">
            <Notification notification={notification} onDismiss={() => setNotification(null)} />
        </div>
      )}
    </div>
  );
};

export default FaucetCard;