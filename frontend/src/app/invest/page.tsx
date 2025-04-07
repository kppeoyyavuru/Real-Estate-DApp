'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ethers } from 'ethers';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FractionalPropertyABI from '../../abi/FractionalProperty.json';
import { CONTRACT_ADDRESS, DEFAULT_NETWORK, PERFORMANCE_SETTINGS } from '../../config';
import WalletConnect from '../../components/WalletConnect';
import ConnectionFallback from '../../components/ConnectionFallback';
import LoadingSpinner from '../../components/LoadingSpinner';

// Client-only wrapper component
const ClientOnly = ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Sample properties to use when blockchain data is unavailable
export const DEFAULT_PROPERTIES = [
  {
    id: 0,
    name: "Luxury Apartment in Manhattan",
    location: "New York, NY",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    totalValue: ethers.parseEther("0.001"),
    totalShares: BigInt(10),
    sharesIssued: BigInt(0), // Start with 0 shares issued
    active: true,
    minInvestment: "0.0001",
    sharePrice: "0.0001" // 1 share = 0.0001 ETH
  },
  {
    id: 1,
    name: "Beachfront Villa",
    location: "Miami, FL",
    imageUrl: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
    totalValue: ethers.parseEther("0.002"),
    totalShares: BigInt(20),
    sharesIssued: BigInt(0), // Start with 0 shares issued
    active: true,
    minInvestment: "0.0001",
    sharePrice: "0.0001" // 1 share = 0.0001 ETH
  },
  {
    id: 2,
    name: "Modern Office Building",
    location: "San Francisco, CA",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    totalValue: ethers.parseEther("0.003"),
    totalShares: BigInt(30),
    sharesIssued: BigInt(0), // Start with 0 shares issued
    active: true,
    minInvestment: "0.0001",
    sharePrice: "0.0001" // 1 share = 0.0001 ETH
  },
  {
    id: 3,
    name: "Mountain Retreat Lodge",
    location: "Aspen, CO",
    imageUrl: "https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=800",
    totalValue: ethers.parseEther("0.0008"),
    totalShares: BigInt(8),
    sharesIssued: BigInt(0), // Start with 0 shares issued
    active: true,
    minInvestment: "0.0001",
    sharePrice: "0.0001" // 1 share = 0.0001 ETH
  },
  {
    id: 4,
    name: "Waterfront Condo",
    location: "Seattle, WA",
    imageUrl: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800",
    totalValue: ethers.parseEther("0.0012"),
    totalShares: BigInt(12),
    sharesIssued: BigInt(0), // Start with 0 shares issued
    active: true,
    minInvestment: "0.0001",
    sharePrice: "0.0001" // 1 share = 0.0001 ETH
  }
];

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
  minInvestment: string;
  isDemo?: boolean;
  sharePrice: string;
};

// Add connection timeout settings
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Add contract deployment checker function
const isContractDeployed = async (provider: ethers.Provider) => {
  try {
    // Check if the contract code exists at the address
    const code = await provider.getCode(CONTRACT_ADDRESS);
    // If code length is greater than '0x', contract exists
    return code !== '0x';
  } catch (error) {
    console.error("Error checking contract deployment:", error);
    return false;
  }
};

export default function InvestmentPage() {
  const { isSignedIn } = useUser();
  const [error, setError] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkCorrect, setNetworkCorrect] = useState(false);

  // Add a retry function
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

  // Check if network is correct and switch if needed
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const requiredChainIdHex = DEFAULT_NETWORK.chainIdHex;
      
      console.log('Current chainId:', chainId, 'Required chainId:', requiredChainIdHex);
      
      // Safe string comparison, ensure both are strings and lowercase
      const currentIdLower = chainId?.toString().toLowerCase() || '';
      const requiredIdLower = requiredChainIdHex?.toString().toLowerCase() || '';
      
      if (currentIdLower !== requiredIdLower) {
        console.log('Network mismatch, attempting to switch...');
        try {
          // Try to switch to the correct network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredChainIdHex }],
          });
          
          // Add small delay to let the switch complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('Network switch successful');
          return true;
        } catch (switchError: any) {
          // Better error handling with fallbacks for empty objects
          const errorCode = switchError?.code;
          const errorMessage = switchError?.message || 'Unknown network switching error';
          
          console.error('Error switching network:', { 
            code: errorCode, 
            message: errorMessage,
            full: switchError 
          });
          
          // This error code indicates that the chain has not been added to MetaMask
          if (errorCode === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: requiredChainIdHex,
                    chainName: DEFAULT_NETWORK.name,
                    rpcUrls: [DEFAULT_NETWORK.rpcUrl],
                    blockExplorerUrls: DEFAULT_NETWORK.blockExplorer ? [DEFAULT_NETWORK.blockExplorer] : undefined,
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18
                    },
                  },
                ],
              });
              
              // Add delay and retry network check
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Verify the network was added and selected
              const updatedChainId = await window.ethereum.request({ method: 'eth_chainId' });
              const success = updatedChainId?.toString().toLowerCase() === requiredIdLower;
              
              console.log('Network added successfully:', success ? 'Yes' : 'No');
              return success;
            } catch (addError: any) {
              const addErrorMessage = addError?.message || 'Unknown error adding network';
              console.error('Error adding network:', addErrorMessage);
              setError('Failed to add network to your wallet. Please add it manually.');
              return false;
            }
          } else if (errorCode === -32002) {
            // MetaMask is already processing a request
            setError('Network switch already pending in your wallet. Please check MetaMask.');
          } else if (errorCode === 4001 || (errorMessage && errorMessage.includes('reject'))) {
            // User rejected the request
            setError('Network switch was rejected. Please switch to ' + DEFAULT_NETWORK.name + ' manually.');
          } else {
            // Generic error
            setError(`Failed to switch network: ${errorMessage}`);
          }
          
          return false;
        }
      }
      console.log('Already on correct network');
      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error checking network';
      console.error('Error checking network:', errorMessage);
      setError('Failed to check network. Please verify your wallet connection.');
      return false;
    }
  };

  // Add contract deployment checker function
  const isContractDeployed = async (provider: ethers.Provider) => {
    try {
      // Check if the contract code exists at the address
      const code = await provider.getCode(CONTRACT_ADDRESS);
      // If code length is greater than '0x', contract exists
      return code !== '0x';
    } catch (error) {
      console.error("Error checking contract deployment:", error);
      return false;
    }
  };

  const connectWalletAndFetchData = async () => {
    try {
      // Focus on connecting wallet for investing
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts',
            params: [] 
          });
          
          if (accounts && accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            const signer = await provider.getSigner();
            setSigner(signer);
            setWalletConnected(true);
            
            // Check network
            const networkSuccess = await checkAndSwitchNetwork();
            setNetworkCorrect(networkSuccess);
          }
        } catch (err) {
          console.log('Wallet connection failed:', err);
        }
      }
    } catch (err: any) {
      console.error('Error during wallet connection:', err);
      setError(err.message || 'An error occurred connecting to wallet.');
    }
  };

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        window.location.reload();
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Load data when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      // Immediately show properties to avoid blank loading state
      setProperties(DEFAULT_PROPERTIES);
      setLoading(false);
      
      // Then try to get real blockchain data in the background
      connectWalletAndFetchData();
    } else {
      setLoading(false);
      setProperties(DEFAULT_PROPERTIES);
    }
  }, [isSignedIn, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError('');
  };

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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Property Investment Opportunities</h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Invest in premium real estate properties with fractional ownership. Build your portfolio with transparent, accessible investments.
          </p>
        </div>

        {/* Wallet Connection Status */}
        <ClientOnly fallback={
          <div className="flex justify-center items-center">
            <LoadingSpinner size="large" />
          </div>
        }>
          <div className="mb-8">
            {!walletConnected ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
                  <p className="text-gray-400">Connect your wallet to explore available investment opportunities.</p>
                </div>
                <WalletConnect 
                  onConnect={(provider, signer) => {
                    setProvider(provider);
                    setSigner(signer);
                    setWalletConnected(true);
                    handleRetry();
                  }}
                  className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                />
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Wallet Connected</h2>
                  <p className="text-gray-400">You can now invest in properties.</p>
                </div>
                {!networkCorrect && (
                  <button
                    onClick={() => checkAndSwitchNetwork()}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Switch Network
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-200">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="ml-4 px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-white rounded transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-colors"
                >
                  <div className="h-48 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={property.imageUrl} 
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-1">{property.name}</h3>
                    <p className="text-gray-400 mb-4">{property.location}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-sm">Investment Progress</span>
                        <span className="text-white text-sm">
                          {(Number(property.sharesIssued) * 100 / Number(property.totalShares)).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                          style={{ width: `${(Number(property.sharesIssued) * 100 / Number(property.totalShares))}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div>
                        <p className="text-gray-400 text-xs">Total Value</p>
                        <p className="text-white">{ethers.formatEther(property.totalValue)} ETH</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Min Investment</p>
                        <p className="text-white">{property.minInvestment} ETH</p>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/invest/${property.id}`}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-center hover:opacity-90 transition-opacity"
                      prefetch={true}
                    >
                      Invest Now
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ClientOnly>
      </div>
    </div>
  );
} 