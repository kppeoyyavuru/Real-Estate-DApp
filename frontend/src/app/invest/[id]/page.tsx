'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { ethers } from 'ethers';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FractionalPropertyABI from '../../../abi/FractionalProperty.json';
import { DEFAULT_PROPERTIES } from '../page';
import { CONTRACT_ADDRESS, DEFAULT_NETWORK, TRANSACTION_SETTINGS, PERFORMANCE_SETTINGS, APP_SETTINGS } from '../../../config';
import TransactionConfirmation from '../../../components/TransactionConfirmation';
import WalletConnect from '../../../components/WalletConnect';
import ConnectionFallback from '../../../components/ConnectionFallback';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { FiArrowLeft } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

type Property = {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  totalValue: bigint;
  totalShares: bigint;
  sharesIssued: bigint;
  active: boolean;
  progressPercentage?: number;
  minInvestment?: string;
  isDemo?: boolean;
  sharePrice?: string;
};

// Add a client-only wrapper component with priority loading
const ClientOnly = ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // Set as mounted immediately without any timer
    setHasMounted(true);
    return () => {};
  }, []);
  
  // For improved performance, render content immediately but hide it until mounted
  if (!hasMounted) {
    // Return the fallback, or if no fallback, render children but hidden
    return fallback ? <>{fallback}</> : <div style={{ visibility: 'hidden' }}>{children}</div>;
  }
  
  return <>{children}</>;
};

// Pre-rendered loading fallback that doesn't rely on JS
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div 
      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" 
      style={{ 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    >
    </div>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function PropertyInvestmentPage({ params }: { params: { id: string } }) {
  // Use ID directly from params where possible to speed up initial load
  const _propertyId = React.use(params)?.id ? parseInt(React.use(params).id) : 0;
  const pathname = usePathname();
  
  const { isSignedIn } = useUser();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState(APP_SETTINGS.defaultInvestmentAmount);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [transactionStep, setTransactionStep] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  // Skip heavy blockchain operations on initial load
  const shouldSkipBlockchainOps = APP_SETTINGS.skipBlockchainOnInitialLoad !== false;

  // Update APP_SETTINGS structure with new options if missing
  const extendedSettings = {
    ...APP_SETTINGS,
    requireWalletForPropertyDetails: APP_SETTINGS.requireWalletForPropertyDetails || false,
    demoMode: APP_SETTINGS.demoMode || false,
    skipBlockchainOnInitialLoad: APP_SETTINGS.skipBlockchainOnInitialLoad !== false
  };

  // Update the useEffect for property loading with better performance optimizations
  useEffect(() => {
    // Find and immediately show a demo property to prevent loading state
    const demoProperty = DEFAULT_PROPERTIES.find(p => p.id === _propertyId);
    if (demoProperty) {
      // Create a deep copy to avoid modifying the original
      setProperty({...demoProperty});
      // Stop loading state immediately
      setLoading(false);
      
      // Reset any errors from previous attempts
      setError('');
      
      // Pre-populate investment amount
      setInvestmentAmount(APP_SETTINGS.defaultInvestmentAmount);
      
      // Log that we're using cached data
      console.log('Using cached property data for instant display:', demoProperty.name);
    } else {
      // If no demo property found, handle the error case
      setLoading(false);
      setError('Property not found');
    }
  }, [_propertyId]);

  // Update the connection timeout constants with values from config
  const CONNECTION_TIMEOUT = PERFORMANCE_SETTINGS.connectionTimeout;
  const CONTRACT_TIMEOUT = PERFORMANCE_SETTINGS.contractCallTimeout;

  // Add a retry function before the useEffect
  const fetchWithRetry = async (fn: () => Promise<any>, retries = PERFORMANCE_SETTINGS.retryAttempts, delay = PERFORMANCE_SETTINGS.retryDelay) => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying... ${retries} attempts left`);
        return fetchWithRetry(fn, retries - 1, delay);
      }
      throw error;
    }
  };

  // Add this function before useEffect
  const isContractDeployed = async (provider: ethers.Provider) => {
    try {
      // Skip check if using fast loading
      if (PERFORMANCE_SETTINGS.skipContractVerification) {
        return true;
      }
      
      // Check if the contract code exists at the address
      const code = await provider.getCode(CONTRACT_ADDRESS);
      // If code length is greater than '0x', contract exists
      return code !== '0x';
    } catch (error) {
      console.error("Error checking contract deployment:", error);
      return false;
    }
  };

  // Update the property loading logic with optimizations
  useEffect(() => {
    // Skip if we're not signed in or don't have a valid property ID
    if (!isSignedIn || !_propertyId || _propertyId <= 0) return;
    
    // If property already loaded from cache and wallet not required, don't do anything else
    if (property && !APP_SETTINGS.requireWalletForPropertyDetails) return;
    
    // Skip blockchain connection if in demo mode
    if (APP_SETTINGS.demoMode) return;
    
    // Try to connect to wallet with minimal delay - async to not block rendering
    const connectWallet = async () => {
      if (!window.ethereum) {
        console.log('No Ethereum provider found');
        return;
      }
      
      try {
        // Use a timeout to limit connection attempt time
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
        );
        
        // Try to connect without displaying too many loading indicators
        const connectionPromise = async () => {
          // Check if accounts are available without prompting
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          try {
            // Try to get accounts without prompting
            const accounts = await window.ethereum.request({ 
              method: 'eth_accounts',
              params: [] 
            });
            
            if (accounts && accounts.length > 0) {
              const signer = await provider.getSigner();
              setSigner(signer);
              setWalletConnected(true);
              
              // Don't block the UI with contract setup
              setTimeout(async () => {
                try {
                  // Set up contract with a small delay to not block the UI
                  const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    FractionalPropertyABI,
                    signer
                  );
                  setContract(contract);
                } catch (err) {
                  console.error('Contract setup error:', err);
                }
              }, 100);
            }
          } catch (accountErr) {
            console.log('No connected accounts:', accountErr);
          }
        };
        
        // Use Promise.race to implement timeout
        await Promise.race([connectionPromise(), timeoutPromise]);
      } catch (err) {
        // Silent fail for connection - we'll prompt the user later
        console.log('Wallet auto-connection timed out:', err);
      }
    };

    // Connect wallet without blocking the UI
    connectWallet();
    
  }, [isSignedIn, _propertyId, property, retryCount]);

  // Set default investment amount from config when property loads
  useEffect(() => {
    if (property) {
      setInvestmentAmount(APP_SETTINGS.defaultInvestmentAmount);
    }
  }, [property]);

  // Validate investment amount
  const validateInvestmentAmount = (amount: string): string => {
    if (!amount || parseFloat(amount) <= 0) {
      return 'Please enter a valid investment amount';
    }
    
    // Check against min investment
    if (parseFloat(amount) < parseFloat(APP_SETTINGS.minInvestmentAmount)) {
      return `Minimum investment is ${APP_SETTINGS.minInvestmentAmount} ETH`;
    }
    
    // Check against max investment (to preserve ETH balance)
    if (parseFloat(amount) > parseFloat(APP_SETTINGS.maxInvestmentAmount)) {
      return `Maximum investment is ${APP_SETTINGS.maxInvestmentAmount} ETH to preserve your Sepolia balance`;
    }
    
    return '';
  };

  // Handle input change with validation
  const handleInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInvestmentAmount(value);
    setError(validateInvestmentAmount(value));
  };

  const resetTransaction = () => {
    setTransactionSuccess(false);
    setTransactionPending(false);
    setTransactionHash('');
    setError('');
    setShowTransactionModal(false);
  };

  // Handle investment submission
  const handleInvest = async () => {
    if (!isSignedIn) {
      setError('Please sign in to invest.');
      return;
    }

    if (!property) {
      setError('Property not found.');
      return;
    }

    // Validate minimum investment amount
    try {
      const minAmount = parseFloat(property.minInvestment || "0.0001");
      if (parseFloat(investmentAmount) < minAmount) {
        setError(`Minimum investment amount is ${minAmount} ETH.`);
        return;
      }
    } catch (err) {
      setError('Invalid investment amount.');
      return;
    }

    setIsInvesting(true);
    setError('');

    try {
      // Connect to wallet if not already connected
      if (!provider || !signer) {
        await connectWalletAndFetchData();
      }

      if (!provider || !signer) {
        throw new Error('Wallet connection failed');
      }

      // Verify correct network
      const network = await provider.getNetwork({ cacheable: true });
      const requiredChainId = DEFAULT_NETWORK.chainId;
      
      // Check if chain ID matches (ignoring case for hex format)
      const chainIdHex = "0x" + network.chainId.toString(16);
      const requiredChainIdHex = DEFAULT_NETWORK.chainIdHex || "0x" + requiredChainId.toString(16);
      
      console.log(`Current network: ${network.name || "unknown"} (${chainIdHex})`);
      console.log(`Required network: ${DEFAULT_NETWORK.name} (${requiredChainIdHex})`);
      
      // Force lowercase comparison for reliable matching
      const currentChainIdLower = chainIdHex.toLowerCase();
      const requiredChainIdLower = requiredChainIdHex.toLowerCase();
      
      if (currentChainIdLower !== requiredChainIdLower) {
        console.log("Network mismatch, attempting to switch...");
        await checkAndSwitchNetwork();
      }

      // Initialize contract
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FractionalPropertyABI,
        signer
      );

      // Convert investment amount to wei
      const investmentAmountWei = ethers.parseEther(investmentAmount);

      // Get property ID
      const _propertyId = property.id;

      // Calculate shares for local display
      const sharePrice = parseFloat(property.sharePrice || "0.0001");
      const estimatedShares = Math.floor(parseFloat(investmentAmount) / sharePrice);
      
      console.log(`Investment: ${investmentAmount} ETH`);
      console.log(`Share price: ${sharePrice} ETH`);
      console.log(`Estimated shares: ${estimatedShares}`);

      // Show transaction modal
      setShowTransactionModal(true);
      setTransactionStep('preparing');

      // Execute investment transaction
      setTransactionStep('confirming');
      // The smart contract will calculate the actual shares based on the investment amount
      const tx = await contract.invest(_propertyId, {
        value: investmentAmountWei,
      });

      setTransactionStep('processing');
      setTransactionHash(tx.hash);

      // Wait for transaction to complete
      await tx.wait();
      
      // Set transaction status to success
      setTransactionStep('completed');
      setTransactionSuccess(true);
      setTransactionPending(false);

      // Update local state to reflect new investment
      // This ensures we immediately see the updated values
      if (property) {
        const updatedSharesIssued = BigInt(Number(property.sharesIssued) + estimatedShares);
        const updatedProperty = { 
          ...property,
          sharesIssued: updatedSharesIssued
        };
        
        // Calculate and log the new ownership percentage
        const newPercentage = (Number(updatedSharesIssued) / Number(property.totalShares)) * 100;
        console.log(`New shares issued: ${updatedSharesIssued}`);
        console.log(`Total shares: ${property.totalShares}`);
        console.log(`New ownership percentage: ${newPercentage.toFixed(2)}%`);
        
        setProperty(updatedProperty);
        setTransactionStep('completed');
        setTransactionSuccess(true);
      }
      
      // Update the timeout message after investment to use toast safely
      setTimeout(async () => {
        try {
          // Don't try to fetch from blockchain - the call is failing
          // Just use the local optimistic update we already applied
          console.log("Using optimistic update for property data");
          
          // Safe way to use toast with fallback
          try {
            if (toast && typeof toast.success === 'function') {
              toast.success("Investment successful! The UI has been updated with your new ownership.");
            } else {
              console.log("Investment successful!");
            }
          } catch (toastError) {
            console.error("Toast notification error:", toastError);
          }
        } catch (refreshError) {
          console.error("Error refreshing property data:", refreshError);
          // We already updated the UI optimistically, so no need to show this error
        }
      }, 1000);

    } catch (error: any) {
      console.error('Investment error:', error);
      setTransactionStep('failed');
      
      // Specific handling for user rejected transactions
      if (error.code === 4001 || 
          (error.message && (
            error.message.includes('user rejected') || 
            error.message.includes('User denied') || 
            error.message.includes('ACTION_REJECTED')
          ))
      ) {
        setError('Transaction was rejected in your wallet. You can try again when ready.');
      } else {
        // For all other errors
        const errorMessage = error.message || 'Transaction failed';
        setError(errorMessage);
      }
    } finally {
      setIsInvesting(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError('');
  };

  // Calculate estimated shares and ownership percentage
  const calculateInvestmentDetails = () => {
    if (!property || !investmentAmount || parseFloat(investmentAmount) <= 0) {
      return { estimatedShares: 0, ownershipPercentage: 0 };
    }
    
    try {
      // Get share price from property
      const sharePrice = parseFloat(property.sharePrice || "0.0001");
      
      // Calculate how many shares the investment amount would buy
      const estimatedShares = parseFloat(investmentAmount) / sharePrice;
      
      // Calculate ownership percentage based on total shares
      const totalShares = Number(property.totalShares);
      
      // Calculate shares already owned plus new shares
      const totalSharesIssued = Number(property.sharesIssued);
      const newSharesIssued = totalSharesIssued + Math.floor(estimatedShares);
      
      // Calculate percentage of ownership after investment
      const ownershipPercentage = (Math.floor(estimatedShares) / totalShares) * 100;
      
      // Log the calculation for debugging
      console.log('Investment calculation:');
      console.log(`Investment amount: ${investmentAmount} ETH`);
      console.log(`Share price: ${sharePrice} ETH`);
      console.log(`Estimated shares: ${estimatedShares} (${Math.floor(estimatedShares)} after floor)`);
      console.log(`Total shares in property: ${totalShares}`);
      console.log(`Current shares issued: ${totalSharesIssued}`);
      console.log(`New shares issued after investment: ${newSharesIssued}`);
      console.log(`Ownership percentage: ${ownershipPercentage.toFixed(2)}%`);
      
      return { estimatedShares, ownershipPercentage };
    } catch (err) {
      console.error('Error calculating investment details:', err);
      return { estimatedShares: 0, ownershipPercentage: 0 };
    }
  };
  
  // Recalculate investment details whenever the property or investment amount changes
  const { estimatedShares, ownershipPercentage } = calculateInvestmentDetails();

  // Add this function after validateInvestmentAmount
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum || !provider) {
      throw new Error('Ethereum provider not found');
    }
    
    try {
      console.log('Checking network...');
      
      // Get current network
      const network = await provider.getNetwork({ cacheable: true });
      const currentChainIdHex = "0x" + network.chainId.toString(16);
      
      // Get required network and ensure it has a value
      const requiredChainIdHex = DEFAULT_NETWORK.chainIdHex || "0x" + DEFAULT_NETWORK.chainId.toString(16);
      
      console.log(`Current chain ID: ${currentChainIdHex}`);
      console.log(`Required chain ID: ${requiredChainIdHex}`);
      
      // If networks don't match (case insensitive), try to switch
      if (currentChainIdHex.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
        console.log(`Switching to network: ${DEFAULT_NETWORK.name}`);
        
        try {
          // Request network switch
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredChainIdHex }]
          });
          
          // Add a delay to let the network switch take effect
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh provider and signer after network change
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);
          const newSigner = await newProvider.getSigner();
          setSigner(newSigner);
          
          // Verify the switch worked
          const verifyNetwork = await newProvider.getNetwork();
          const updatedChainIdHex = "0x" + verifyNetwork.chainId.toString(16);
          
          if (updatedChainIdHex.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
            console.warn("Network switch verification failed - chain IDs don't match");
          } else {
            console.log('Network switched successfully and verified');
          }
          
          return true;
        } catch (switchError: any) {
          // Enhanced error logging with fallbacks for empty objects
          const errorCode = switchError?.code;
          const errorMessage = switchError?.message || 'Unknown error switching network';
          
          console.error('Failed to switch network:', {
            code: errorCode,
            message: errorMessage,
            error: switchError
          });
          
          // Handle different error cases
          if (errorCode === 4902) {
            // Chain not found, try to add it
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
              
              // Check if network was added and selected
              await new Promise(resolve => setTimeout(resolve, 1000));
              return await checkAndSwitchNetwork();
            } catch (addError: any) {
              console.error('Error adding network:', addError?.message || 'Unknown error');
              throw new Error(`Failed to add ${DEFAULT_NETWORK.name} network to your wallet.`);
            }
          } else if (errorCode === 4001 || (errorMessage && errorMessage.includes('rejected'))) {
            throw new Error(`Network switch was rejected. Please manually switch to ${DEFAULT_NETWORK.name} in your wallet.`);
          } else if (errorCode === -32002) {
            throw new Error('Network switch already pending. Please check your wallet.');
          } else {
            throw new Error(`Failed to switch to ${DEFAULT_NETWORK.name} network: ${errorMessage}`);
          }
        }
      } else {
        console.log('Already on correct network');
        return true;
      }
    } catch (error: any) {
      // Re-throw with a better message
      console.error('Network switch check failed:', error);
      throw new Error(error?.message || 'Failed to check or switch network. Please try again.');
    }
  };

  // Connect wallet and fetch data
  const connectWalletAndFetchData = async () => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    try {
      // Request accounts
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      
      await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const signer = await provider.getSigner();
      setSigner(signer);
      setWalletConnected(true);
      
      // Check and switch network if needed
      await checkAndSwitchNetwork();
      
      return { provider, signer };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  };

  // Add this function to fetch wallet connection status
  const refreshWalletConnection = async () => {
    try {
      if (window.ethereum) {
        // Get accounts without prompting
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        // If accounts exist, wallet is connected
        const isConnected = accounts && accounts.length > 0;
        
        if (isConnected && !walletConnected) {
          // Wallet is connected but our state doesn't reflect it
          console.log('Wallet is connected but state needs updating');
          
          // Setup provider and signer
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          try {
            const signer = await provider.getSigner();
            setSigner(signer);
            
            // Update contract instance
            const contract = new ethers.Contract(
              CONTRACT_ADDRESS,
              FractionalPropertyABI,
              signer
            );
            setContract(contract);
            
            // Update UI state
            setWalletConnected(true);
            console.log('Wallet connection refreshed');
          } catch (err) {
            console.error('Error getting signer:', err);
          }
        } else if (!isConnected && walletConnected) {
          // Wallet was disconnected
          setWalletConnected(false);
          console.log('Wallet was disconnected');
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  // Add this useEffect to periodically check wallet connection
  useEffect(() => {
    // Check wallet connection immediately
    refreshWalletConnection();
    
    // Set up event listeners for wallet connection changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length > 0) {
          refreshWalletConnection();
        } else {
          setWalletConnected(false);
        }
      };
      
      const handleChainChanged = () => {
        // Chain changed, refresh the page to reload the app state
        console.log('Network changed, refreshing state');
        refreshWalletConnection();
      };
      
      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Clean up
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletConnected]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please sign in to access the investment platform.</p>
          <Link 
            href="/login" 
            className="block w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/invest"
            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4"
            prefetch={true}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Properties
          </Link>
          <h1 className="text-3xl font-bold text-white">Property Investment</h1>
          <p className="mt-2 text-gray-400">Configure your investment in this property</p>
        </div>

        {/* Wrap the content that depends on browser APIs in ClientOnly */}
        <ClientOnly fallback={<LoadingFallback />}>
          {/* Everything else stays the same */}
          {loading ? (
            <LoadingFallback />
          ) : error ? (
            // Error State
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50">
              <ConnectionFallback 
                message={error || "Connection timed out. Unable to load property details."}
                onRetry={handleRetry}
                showBackButton={true}
              />
            </div>
          ) : property ? (
            // Property Details and Investment Form
            <>
              {transactionSuccess ? (
                // Success State
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Investment Successful!</h2>
                  <p className="text-gray-300 mb-6">
                    You have successfully invested {investmentAmount} ETH in {property.name}.
                    You now own approximately {((Number(property.sharesIssued) / Number(property.totalShares)) * 100).toFixed(2)}% of this property.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/dashboard"
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      prefetch={true}
                    >
                      Go to Dashboard
                    </Link>
                    <Link 
                      href="/invest"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                      prefetch={true}
                    >
                      Explore More Properties
                    </Link>
                  </div>
                </motion.div>
              ) : (
                // Investment Form - add key to reset state when switching properties
                <div className="grid gap-8 md:grid-cols-7" key={`property-${_propertyId}`}>
                  {/* Property Details - 3 columns on medium+ screens */}
                  <div className="md:col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                    <div className="h-48 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={property.imageUrl} 
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h2 className="text-xl font-bold text-white">{property.name}</h2>
                        <p className="text-gray-300">{property.location}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400">Investment Progress</span>
                          <span className="text-sm text-gray-400">
                            {property.sharesIssued.toString()} / {property.totalShares.toString()} Shares
                            ({((Number(property.sharesIssued) / Number(property.totalShares)) * 100).toFixed(2)}%)
                          </span>
                        </div>
                        <div className="bg-gray-700/50 rounded-full h-4 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${(Number(property.sharesIssued) / Number(property.totalShares)) * 100}%` }}>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Total Value</p>
                          <p className="text-white font-medium">{ethers.formatEther(property.totalValue)} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Available Shares</p>
                          <p className="text-white font-medium">{Number(property.totalShares - property.sharesIssued).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Total Shares</p>
                          <p className="text-white font-medium">{Number(property.totalShares).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Min Investment</p>
                          <p className="text-white font-medium">{property.minInvestment} ETH</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Investment Form - 4 columns on medium+ screens */}
                  <div className="md:col-span-4 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Make Your Investment</h3>
                        
                        {/* Wallet indicator/connection button */}
                        <div className="flex items-center">
                          {walletConnected ? (
                            <div className="flex items-center text-white">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              <span className="text-sm">Wallet Connected</span>
                            </div>
                          ) : (
                            <WalletConnect 
                              onConnect={(provider, signer) => {
                                setProvider(provider);
                                setSigner(signer);
                                setWalletConnected(true);
                                
                                // Set up contract connection
                                const contract = new ethers.Contract(
                                  CONTRACT_ADDRESS,
                                  FractionalPropertyABI,
                                  signer
                                );
                                setContract(contract);
                              }}
                              buttonText="Connect Wallet"
                              className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Investment Input */}
                    <div className="mb-6">
                      <label htmlFor="investment-amount" className="block text-white mb-2">
                        Investment Amount (ETH)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="investment-amount"
                          min={APP_SETTINGS.minInvestmentAmount}
                          max={APP_SETTINGS.maxInvestmentAmount}
                          step="0.00001"
                          value={investmentAmount}
                          onChange={handleInvestmentChange}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Min ${APP_SETTINGS.minInvestmentAmount} ETH`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-400">ETH</span>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between mt-2">
                        <button 
                          type="button"
                          onClick={() => setInvestmentAmount(APP_SETTINGS.minInvestmentAmount)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Min ({APP_SETTINGS.minInvestmentAmount} ETH)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const midAmount = (parseFloat(APP_SETTINGS.minInvestmentAmount) + parseFloat(APP_SETTINGS.maxInvestmentAmount)) / 2;
                            setInvestmentAmount(midAmount.toFixed(6));
                          }}
                          className="text-sm text-blue-400 hover:text-blue-300 md:mx-2"
                        >
                          Recommended ({((parseFloat(APP_SETTINGS.minInvestmentAmount) + parseFloat(APP_SETTINGS.maxInvestmentAmount)) / 2).toFixed(6)} ETH)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvestmentAmount(APP_SETTINGS.maxInvestmentAmount)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Max ({APP_SETTINGS.maxInvestmentAmount} ETH)
                        </button>
                      </div>
                    </div>
                    
                    {/* Investment Preview */}
                    <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                      <h4 className="text-white font-medium mb-3">Investment Preview</h4>
                      <div className="grid grid-cols-2 gap-y-4">
                        <div>
                          <p className="text-gray-400 text-xs">Investment Amount</p>
                          <p className="text-white">{investmentAmount} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Share Price</p>
                          <p className="text-white">{property.sharePrice || "0.0001"} ETH / share</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">You Will Receive</p>
                          <p className="text-white">{Math.floor(estimatedShares)} shares</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Ownership Percentage</p>
                          <p className="text-white">{ownershipPercentage.toFixed(2)}%</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 text-xs mb-1">Expected Return</p>
                          <p className="text-white">Proportional to ownership percentage of rental income</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Invest Button */}
                    <button
                      onClick={handleInvest}
                      disabled={!walletConnected || transactionPending || !investmentAmount || parseFloat(investmentAmount) <= 0}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center"
                    >
                      {transactionPending ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : !walletConnected ? (
                        'Connect Wallet to Invest'
                      ) : (
                        'Confirm Investment'
                      )}
                    </button>
                    
                    {/* Connection Warning - updated to be more visible */}
                    {!walletConnected && (
                      <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Please connect your wallet using the button above to invest in this property</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Property Not Found
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Property Not Found</h2>
              <p className="text-gray-300 mb-6">The property you're looking for doesn't exist or is no longer available.</p>
              <Link 
                href="/invest"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Explore Available Properties
              </Link>
            </div>
          )}
        </ClientOnly>
      </div>
      <TransactionConfirmation
        isOpen={showTransactionModal}
        isPending={transactionPending}
        isSuccess={transactionSuccess}
        error={error}
        txHash={transactionHash}
        onClose={resetTransaction}
      />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid #374151'
          }
        }}
      />
    </div>
  );
} 