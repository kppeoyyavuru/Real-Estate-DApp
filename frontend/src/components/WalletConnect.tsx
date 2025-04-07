import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_NETWORK, PERFORMANCE_SETTINGS } from '../config';

interface WalletConnectProps {
  onConnect: (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => void;
  buttonText?: string;
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ 
  onConnect, 
  buttonText = 'Connect Wallet',
  className = 'px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity'
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState('');

  // Add a helper function for retry logic
  const withRetry = async (fn: () => Promise<any>, retries = PERFORMANCE_SETTINGS.retryAttempts, delay = PERFORMANCE_SETTINGS.retryDelay) => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying wallet operation... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay);
      }
      throw error;
    }
  };

  // Update the checkConnection function to handle connection timeouts better
  useEffect(() => {
    const checkConnection = async () => {
      // Only run in browser environment to prevent SSR/CSR mismatches
      if (typeof window === 'undefined' || !window.ethereum) return;
      
      // Instead of using Promise.race which can cause hydration issues,
      // use a more controlled approach with timeouts
      try {
        const checkAccountsPromise = async () => {
          try {
            // First just check if accounts are available without initiating full connection
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
              // Update UI state immediately with the address
              setUserAddress(accounts[0]);
              setWalletConnected(true);
              
              // Get provider info only if accounts exist
              try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                // Get network info with caching if enabled
                const network = await provider.getNetwork({ 
                  cacheable: PERFORMANCE_SETTINGS.cacheNetworkInfo 
                });
                const chainIdHex = `0x${network.chainId.toString(16)}`;
                
                // Get signer only if needed and if on correct network
                if (chainIdHex === DEFAULT_NETWORK.chainId) {
                  try {
                    const signer = await provider.getSigner();
                    onConnect(provider, signer);
                  } catch (signerErr) {
                    console.warn('Failed to get signer, but wallet is connected:', signerErr);
                  }
                }
              } catch (networkErr) {
                console.warn('Network check failed, but connection established');
              }
            }
          } catch (err) {
            console.warn('Initial connection check failed');
          }
        };
        
        // Use a simpler timeout approach that won't cause React hydration issues
        let hasTimedOut = false;
        const timeoutId = setTimeout(() => {
          hasTimedOut = true;
          console.warn('Connection check timed out');
        }, PERFORMANCE_SETTINGS.connectionTimeout);
        
        await checkAccountsPromise();
        clearTimeout(timeoutId);
        
        if (hasTimedOut) {
          console.warn('Connection completed but timeout already occurred');
        }
      } catch (err) {
        console.error('Error in wallet connection check:', err);
      }
    };
    
    // Wait a moment after initial render to check connection
    // This helps prevent hydration mismatches
    const timer = setTimeout(() => {
      checkConnection();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [onConnect, DEFAULT_NETWORK.chainId]);

  // Handle account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setWalletConnected(false);
          setUserAddress('');
        } else {
          // Address changed, reinitialize connection
          connectWallet();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Check and switch to the correct network
  const checkAndSwitchNetwork = async (provider: ethers.BrowserProvider) => {
    try {
      // Use cacheable option for faster network retrieval
      const network = await provider.getNetwork({ cacheable: true });
      const chainIdHex = `0x${network.chainId.toString(16)}`;
      const requiredChainIdHex = DEFAULT_NETWORK.chainIdHex || DEFAULT_NETWORK.chainId.toString(16);
      
      console.log(`Current network: ${network.name || 'unknown'} (ChainID: ${chainIdHex})`);
      console.log(`Required network: ${DEFAULT_NETWORK.name} (ChainID: ${requiredChainIdHex})`);
      
      // Use case-insensitive comparison to avoid issues with Sepolia hex format
      if (chainIdHex.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
        try {
          console.log(`Network mismatch. Attempting to switch to ${DEFAULT_NETWORK.name}...`);
          
          // Request network switch with retry
          await withRetry(() => 
            window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: requiredChainIdHex }]
            })
          );
          
          // Wait a moment for the network change to take effect
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify switch was successful with retry
          const updatedNetwork = await withRetry(() => 
            provider.getNetwork({ cacheable: false })
          );
          const updatedChainIdHex = `0x${updatedNetwork.chainId.toString(16)}`;
          
          if (updatedChainIdHex.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
            console.error(`Network switch failed. Current: ${updatedChainIdHex}, Required: ${requiredChainIdHex}`);
            setError(`Please switch to the ${DEFAULT_NETWORK.name} network in your wallet.`);
            return false;
          }
          
          console.log(`Successfully switched to ${DEFAULT_NETWORK.name}`);
          return true;
        } catch (switchError: any) {
          console.error('Network switch error:', switchError);
          
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // If the chain is not available, try to add it
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: requiredChainIdHex,
                  chainName: DEFAULT_NETWORK.name,
                  rpcUrls: [DEFAULT_NETWORK.rpcUrl],
                  blockExplorerUrls: [DEFAULT_NETWORK.blockExplorer],
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                  }
                }]
              });
              // Check if network was added successfully
              return await checkAndSwitchNetwork(provider);
            } catch (addError) {
              setError(`Could not add ${DEFAULT_NETWORK.name} network to your wallet.`);
              return false;
            }
          } else if (switchError.code === -32002) {
            setError(`Network switch already pending. Please check your wallet.`);
          } else if (switchError.message && switchError.message.includes('rejected')) {
            setError(`Network switch was rejected. Please manually switch to ${DEFAULT_NETWORK.name}.`);
          } else {
            setError(`Failed to switch network: ${switchError.message || 'Unknown error'}`);
          }
          return false;
        }
      }
      
      console.log(`Already on correct network: ${DEFAULT_NETWORK.name}`);
      return true;
    } catch (err: any) {
      console.error('Network check error:', err);
      setError(`Unable to check network: ${err.message || 'Unknown error'}. Please refresh and try again.`);
      return false;
    }
  };

  // Improve the connectWallet function with better error handling
  const connectWallet = async () => {
    if (isConnecting) return; // Prevent multiple connection attempts
    
    setIsConnecting(true);
    setError('');
    
    try {
      if (!window.ethereum) {
        setError('No Ethereum wallet found. Please install MetaMask.');
        setIsConnecting(false);
        return;
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection request timed out')), 
        PERFORMANCE_SETTINGS.connectionTimeout)
      );
      
      // Create the connection promise with retry
      const connectionPromise = async () => {
        // Use direct ethereum request instead of provider.send for initial connection
        const accounts = await withRetry(() => 
          window.ethereum.request({ 
            method: 'eth_requestAccounts',
            params: [] 
          })
        );
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found. Please check your wallet.');
        }
        
        // Update UI state immediately
        setUserAddress(accounts[0]);
        setWalletConnected(true);
        
        // Initialize provider after account access granted
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Ensure correct network
        const networkSuccess = await checkAndSwitchNetwork(provider);
        if (!networkSuccess) {
          throw new Error(`Please switch to the ${DEFAULT_NETWORK.name} network in your wallet.`);
        }
        
        // Get signer last, only if necessary
        const signer = await withRetry(() => provider.getSigner());
        
        // Call the onConnect callback with the provider and signer
        onConnect(provider, signer);
      };
      
      // Race between connection and timeout
      await Promise.race([connectionPromise(), timeoutPromise]);
      
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      // Better error handling with more specific messages
      if (err.code === 4001) {
        // User rejected the request
        setError('Please connect your wallet to continue.');
      } else if (err.code === -32002) {
        setError('Connection request already pending. Please check your MetaMask popup.');
      } else if (err.message && err.message.includes('timed out')) {
        setError('Connection request timed out. Please try again or check your wallet.');
      } else if (err.message && err.message.includes('already processing')) {
        setError('Wallet is busy with another request. Please wait a moment and try again.');
      } else {
        setError(`Failed to connect: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div>
      {error && (
        <div className="text-red-400 text-sm mb-2">{error}</div>
      )}
      
      {walletConnected ? (
        <div className="flex items-center gap-2">
          <div className="bg-green-500/20 px-3 py-1 rounded-full text-sm text-green-300 border border-green-500/50">
            {formatAddress(userAddress)}
          </div>
          <button 
            onClick={connectWallet}
            className="text-gray-400 hover:text-white text-sm"
            title="Reconnect wallet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`${className} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Connecting...
            </span>
          ) : (
            buttonText
          )}
        </button>
      )}
    </div>
  );
};

export default WalletConnect; 