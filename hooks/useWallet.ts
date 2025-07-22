import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TESTNET_CHAIN_ID, TESTNET_NAME, FAUCET_TOKEN_SYMBOL, TESTNET_EXPLORER_URL, TESTNET_RPC_URL } from '../constants';

// Define a more complete type for the EIP-1193 provider from window.ethereum
// as the one from ethers.js is minimal and doesn't include event handlers.
interface EIP1193Provider extends ethers.Eip1193Provider {
    on(event: 'accountsChanged', listener: (accounts: string[]) => void): this;
    on(event: 'chainChanged', listener: (chainId: string) => void): this;
    removeListener(event: 'accountsChanged', listener: (accounts: string[]) => void): this;
    removeListener(event: 'chainChanged', listener: (chainId: string) => void): this;
    request(args: { method: 'wallet_switchEthereumChain', params: [{ chainId: string }] }): Promise<null>;
    request(args: { method: 'wallet_addEthereumChain', params: [any] }): Promise<null>;
}

interface EthersWindow extends Window {
    ethereum?: EIP1193Provider;
}

const checkNetwork = async (provider: ethers.BrowserProvider): Promise<boolean> => {
    if (!TESTNET_CHAIN_ID) return true; // Skip check if ID is not set in constants
    const network = await provider.getNetwork();
    return network.chainId.toString() === TESTNET_CHAIN_ID;
};

export const useWallet = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  
  const switchOrAddNetwork = useCallback(async () => {
    const ethereum = (window as EthersWindow).ethereum;
    if (!ethereum) {
      setError('MetaMask not found. Please install the extension.');
      return;
    }
    setError(null);

    const hexChainId = `0x${parseInt(TESTNET_CHAIN_ID, 10).toString(16)}`;

    try {
      // Try to switch to the chain
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: TESTNET_NAME,
                rpcUrls: [TESTNET_RPC_URL],
                nativeCurrency: {
                  name: FAUCET_TOKEN_SYMBOL,
                  symbol: FAUCET_TOKEN_SYMBOL,
                  decimals: 18,
                },
                blockExplorerUrls: [TESTNET_EXPLORER_URL],
              },
            ],
          });
        } catch (addError: any) {
          setError('Failed to add the network. Please try again.');
          console.error('Could not add network:', addError);
        }
      } else {
        setError('Failed to switch network. Please do it manually in your wallet.');
        console.error('Could not switch network:', switchError);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const ethereum = (window as EthersWindow).ethereum;
    if (ethereum) {
      setIsConnecting(true);
      setError(null);
      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        
        const isCorrectNetwork = await checkNetwork(browserProvider);
        setIsWrongNetwork(!isCorrectNetwork);
        
        setProvider(browserProvider);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (err: unknown) {
        setError('Wallet connection rejected by user.');
        console.error("Wallet connection failed:", err);
      } finally {
        setIsConnecting(false);
      }
    } else {
      setError('MetaMask not found. Please install the extension.');
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      setError(null);
    } else {
      setAddress(null);
      setProvider(null);
      setIsWrongNetwork(false);
      setError(null); // Clear errors on disconnect
    }
  }, []);

  const handleChainChanged = useCallback(async () => {
    if (provider) {
      const isCorrectNetwork = await checkNetwork(provider);
      setIsWrongNetwork(!isCorrectNetwork);
    }
  }, [provider]);

  useEffect(() => {
    const ethereum = (window as EthersWindow).ethereum;
    if (ethereum) {
      // The `on` and `removeListener` methods are now correctly typed thanks to the EIP1193Provider interface.
      // The `handleChainChanged` function doesn't use the `chainId` argument passed by the event, which is acceptable.
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged, provider]);

  return { provider, address, error, isConnecting, isWrongNetwork, connectWallet, switchOrAddNetwork };
};