
import React from 'react';
import { WalletIcon } from './Icon';

interface ConnectWalletButtonProps {
  connectWallet: () => Promise<void>;
  isLoading: boolean;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ connectWallet, isLoading }) => {
  if (isLoading) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 transition-colors duration-200"
      >
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Connecting...
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
    >
        <WalletIcon className="h-5 w-5 mr-2"/>
        Connect Wallet
    </button>
  );
};

export default ConnectWalletButton;