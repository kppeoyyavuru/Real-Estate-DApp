'use client';
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FractionalPropertyABI from '../../abi/FractionalProperty.json';
import { CONTRACT_ADDRESS, DEFAULT_NETWORK, APP_SETTINGS } from '../../config';
import { DEFAULT_PROPERTIES } from '../invest/page';
import { Toaster, toast } from "react-hot-toast";
import Image from "next/image";

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

// Loading spinner component
const LoadingSpinner = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-3",
  };
  
  return (
    <div className={`rounded-full border-t-transparent border-blue-500 animate-spin ${sizeClasses[size]}`}></div>
  );
};

type Investment = {
  propertyId: number;
  name: string;
  location: string;
  imageUrl: string;
  shares: bigint;
  totalShares: bigint;
  ownershipPercentage: number;
  value: string;
  valueEth: bigint;
};

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalProperties: 0,
    portfolioValue: '0',
    totalShares: 0,
    returnRate: '7.5%'
  });
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Connect wallet and fetch investments
  const connectWalletAndFetchData = async () => {
    if (!window.ethereum) {
      setError("MetaMask not installed. Please install a Web3 wallet to view your investments.");
      setLoading(false);
      return;
    }
    
    try {
      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get accounts without prompting if already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts'
      });
      
      if (!accounts || accounts.length === 0) {
        // If no accounts, try to request access
        try {
          await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          setWalletConnected(true);
        } catch (reqError) {
          console.error("User denied account access:", reqError);
          setError("Please connect your wallet to view investments");
          setLoading(false);
          return;
        }
      } else {
        setWalletConnected(true);
      }
      
      // Get signer and user address
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setWalletAddress(userAddress);
      
      // Check network
      const network = await provider.getNetwork();
      const chainIdHex = "0x" + network.chainId.toString(16);
      // Safe way to get required chain ID in hex format
      const requiredChainIdHex = (DEFAULT_NETWORK.chainIdHex || "0x" + DEFAULT_NETWORK.chainId.toString(16));
      
      // Compare in lowercase to avoid case sensitivity issues
      if (chainIdHex.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
        // Wrong network, but we can still show demo data
        console.log(`Wrong network: ${chainIdHex} vs required ${requiredChainIdHex}`);
        // Use demo data for now
        loadDemoInvestments(userAddress);
        setLoading(false);
        return;
      }
      
      // Connect to contract
      try {
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          FractionalPropertyABI,
          signer
        );
        
        // Check if contract is available
        const isDeployed = await isContractDeployed(provider);
        if (!isDeployed) {
          console.log("Contract not deployed, using demo data");
          loadDemoInvestments(userAddress);
          setLoading(false);
          return;
        }
        
        // Get all properties from contract
        console.log("Fetching properties from contract...");
        let allProperties;
        try {
          allProperties = await contract.getAllProperties();
          console.log("Properties retrieved:", allProperties.length);
        } catch (contractReadError) {
          console.error("Error reading properties from contract:", contractReadError);
          loadDemoInvestments(userAddress);
          setLoading(false);
          return;
        }
        
        // Process investment data for each property
        const investmentsData: Investment[] = [];
        let totalValueEth = ethers.parseEther("0");
        let totalShares = 0;
        
        for (const property of allProperties) {
          const propertyId = Number(property.id);
          
          try {
            // Get user's shares for this property
            const userShares = await contract.getUserInvestment(propertyId, userAddress);
            
            if (userShares > 0) {
              // Calculate value of investment and ownership percentage
              const shareValue = (userShares * property.totalValue) / property.totalShares;
              const ownershipPercentage = (Number(userShares) * 100) / Number(property.totalShares);
              
              totalValueEth += shareValue;
              totalShares += Number(userShares);
              
              investmentsData.push({
                propertyId,
                name: property.name,
                location: property.location,
                imageUrl: property.imageUrl,
                shares: userShares,
                totalShares: property.totalShares,
                ownershipPercentage,
                valueEth: shareValue,
                value: ethers.formatEther(shareValue)
              });
            }
          } catch (investmentError) {
            console.error(`Error fetching investment for property ${propertyId}:`, investmentError);
          }
        }
        
        // Update state with real data
        setInvestments(investmentsData);
        setPortfolioStats({
          totalProperties: investmentsData.length,
          portfolioValue: ethers.formatEther(totalValueEth),
          totalShares,
          returnRate: '7.5%' // Example return rate, could be calculated dynamically
        });
        
      } catch (contractError) {
        console.error("Contract error:", contractError);
        loadDemoInvestments(userAddress);
      }
      
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect to your wallet. Please refresh and try again.");
      loadDemoInvestments("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // Demo wallet address
    } finally {
      setLoading(false);
    }
  };
  
  // Check if contract exists
  const isContractDeployed = async (provider: ethers.Provider) => {
    try {
      // Check if the contract code exists at the address
      const code = await provider.getCode(CONTRACT_ADDRESS);
      return code !== '0x';
    } catch (error) {
      console.error("Error checking contract deployment:", error);
      return false;
    }
  };
  
  // Check and switch network - fixed for string compatibility
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Get the required chain ID in the same format for comparison
      const requiredChainIdHex = DEFAULT_NETWORK.chainIdHex;
      
      console.log('Current chainId:', chainId, 'Required chainId:', requiredChainIdHex);
      
      // Case insensitive comparison
      if (chainId.toString().toLowerCase() !== requiredChainIdHex.toLowerCase()) {
        console.log('Network mismatch, attempting to switch...');
        try {
          // Try to switch to the correct network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredChainIdHex }],
          });
          
          console.log('Network switch successful');
          
          // Verify the switch was successful by checking chainId again
          const updatedChainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (updatedChainId.toString().toLowerCase() !== requiredChainIdHex.toLowerCase()) {
            console.warn('Network switch may not have completed properly');
          }
          
          // Add a small delay to let MetaMask complete the switch
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return true;
        } catch (switchError: any) {
          // Enhanced error handling with proper fallbacks for empty errors
          const errorCode = switchError?.code;
          const errorMessage = switchError?.message || 'Unknown network switching error';
          
          console.error('Error switching network:', {
            code: errorCode,
            message: errorMessage,
            error: switchError
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
                    blockExplorerUrls: [DEFAULT_NETWORK.blockExplorer],
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  },
                ],
              });
              console.log('Network added successfully');
              
              // Add a small delay to let MetaMask complete the addition
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              return true;
            } catch (addError: any) {
              console.error('Error adding network:', addError?.message || 'Unknown error adding network');
              setError('Failed to add network to your wallet. Please add it manually.');
              return false;
            }
          } else if (errorCode === -32002) {
            // MetaMask is already processing a request
            setError('Network switch already pending in your wallet. Please check MetaMask.');
          } else if (errorCode === 4001 || (errorMessage && errorMessage.includes('rejected'))) {
            // User rejected the request
            setError('Network switch was rejected. Please switch network manually in your wallet.');
          } else {
            // Generic error
            setError(`Failed to switch to ${DEFAULT_NETWORK.name} network. Please try manually.`);
          }
          
          return false;
        }
      }
      console.log('Already on correct network');
      return true;
    } catch (error: any) {
      console.error('Error checking network:', error?.message || 'Unknown error');
      setError('Failed to check network. Please verify your wallet connection.');
      return false;
    }
  };
  
  // Load demo investments for testing - fix toast issue
  const loadDemoInvestments = (userAddress: string) => {
    const demoInvestments: Investment[] = [];
    let totalValueEth = ethers.parseEther("0");
    let totalShares = 0;
    
    // Generate demo investments from default properties
    DEFAULT_PROPERTIES.slice(0, 3).forEach((property, index) => {
      // Simulate user owning different amounts of shares
      const sharesOwned = BigInt(index === 0 ? 3 : index === 1 ? 5 : 2);
      const shareValue = (sharesOwned * property.totalValue) / property.totalShares;
      const ownershipPercentage = (Number(sharesOwned) * 100) / Number(property.totalShares);
      
      totalValueEth += shareValue;
      totalShares += Number(sharesOwned);
      
      demoInvestments.push({
        propertyId: property.id,
        name: property.name,
        location: property.location,
        imageUrl: property.imageUrl,
        shares: sharesOwned,
        totalShares: property.totalShares,
        ownershipPercentage,
        valueEth: shareValue,
        value: ethers.formatEther(shareValue)
      });
    });
    
    // Update state with demo data
    setInvestments(demoInvestments);
    setPortfolioStats({
      totalProperties: demoInvestments.length,
      portfolioValue: ethers.formatEther(totalValueEth),
      totalShares,
      returnRate: '7.5%'
    });
    
    setWalletAddress(userAddress);
    // Fix toast issue by only showing console message
    console.log("Using demo data - connect to the correct network for real data");
    
    // Try to use toast.success which is more widely available
    try {
      if (toast && typeof toast.success === 'function') {
        toast.success("Using demo investment data", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Toast notification failed:", error);
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    setError('');
    setLoading(true);
    setRetryCount(count => count + 1);
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

  // Fetch investments when component mounts
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      connectWalletAndFetchData();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false); // Not signed in, don't show loading
    }
  }, [isLoaded, isSignedIn, retryCount]);

  // Add this function after other useEffect hooks
  // Fetch user profile data from the database
  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      console.log('Fetching user profile data for ID:', userId);
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch profile data: ${response.status}`);
        setLoadingProfile(false);
        return;
      }
      
      const data = await response.json();
      console.log('Profile API response:', data);
      
      if (data.success && data.profile) {
        console.log('Setting profile data:', data.profile);
        setProfileData(data.profile);
      } else {
        console.log('No profile data found in response');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Add this useEffect to fetch profile when user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Fetch user profile data
      fetchUserProfile(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  // If not signed in, show authentication required screen
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please sign in to access your dashboard.</p>
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
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Dashboard Content */}
      <ClientOnly fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      }>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to PropChain</h1>
              <p className="text-gray-400">Manage your real estate investments</p>
            </div>
              <div className="flex items-center space-x-4">
                {isSignedIn && <UserButton afterSignOutUrl="/" />}
              </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Profile Details</h2>
              <div className="flex space-x-3">
                {!walletConnected && (
                  <button 
                    onClick={connectWalletAndFetchData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
            <Link 
                  href="/profile/edit" 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Edit Profile
            </Link>
              </div>
          </div>

          {loading || loadingProfile ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="medium" />
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 mb-1">Username</p>
                  <p className="text-white">
                    {profileData?.username || user?.username || user?.firstName || 'Not set'}
                    {profileData?.username && <span className="ml-2 text-green-400 text-xs">(Custom)</span>}
                  </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Email</p>
                  <p className="text-white">{user?.emailAddresses?.[0]?.emailAddress || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Phone</p>
                  <p className="text-white">
                    {profileData?.phone || user?.phoneNumbers?.[0]?.phoneNumber || 'Not set'}
                    {profileData?.phone && <span className="ml-2 text-green-400 text-xs">(Custom)</span>}
                  </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Wallet Address</p>
                <p className="text-white font-mono text-sm">
                    {walletAddress ? (
                    <>
                        {walletAddress.slice(0, 6)}...
                        {walletAddress.slice(-4)}
                    </>
                  ) : profileData?.walletAddress ? (
                    <>
                      {profileData.walletAddress.slice(0, 6)}...
                      {profileData.walletAddress.slice(-4)}
                      <span className="ml-2 text-green-400 text-xs">(Saved)</span>
                    </>
                  ) : (
                    'Not connected'
                  )}
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Portfolio Stats */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
              <h3 className="text-gray-300 text-sm mb-2">Total Properties</h3>
              <p className="text-white text-2xl font-bold">{portfolioStats.totalProperties}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-400/20 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
              <h3 className="text-gray-300 text-sm mb-2">Portfolio Value</h3>
              <p className="text-white text-2xl font-bold">{parseFloat(portfolioStats.portfolioValue).toFixed(4)} ETH</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-400/20 rounded-xl p-6 border border-indigo-500/30 backdrop-blur-sm">
              <h3 className="text-gray-300 text-sm mb-2">Total Shares</h3>
              <p className="text-white text-2xl font-bold">{portfolioStats.totalShares}</p>
            </div>
            <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
              <h3 className="text-gray-300 text-sm mb-2">Average Return Rate</h3>
              <p className="text-white text-2xl font-bold">{portfolioStats.returnRate}</p>
            </div>
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

          {/* Investments Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Your Investments</h2>
              <Link 
                href="/invest" 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Invest More
              </Link>
            </div>

            {loading ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 flex justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : investments.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {investments.map((investment) => (
                  <motion.div
                    key={investment.propertyId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="h-48 relative">
                      {/* Property Image */}
                      <img
                        src={investment.imageUrl}
                        alt={investment.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Ownership Badge */}
                      <div className="absolute top-3 right-3 bg-blue-500/80 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
                        {investment.ownershipPercentage.toFixed(2)}% Owned
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white mb-1">{investment.name}</h3>
                      <p className="text-gray-400 mb-4">{investment.location}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                          <p className="text-gray-400 text-xs">Your Shares</p>
                          <p className="text-white">{investment.shares.toString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Value</p>
                          <p className="text-white">{parseFloat(investment.value).toFixed(4)} ETH</p>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/invest/${investment.propertyId}`}
                        className="block w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-center hover:opacity-90 transition-opacity"
                      >
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/50">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-white mb-2">No investments found</h3>
                  <p className="text-gray-400 mb-6">Start your real estate investment journey today by investing in a property.</p>
                  <Link 
                    href="/invest" 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg inline-block hover:opacity-90 transition-opacity"
                  >
                    Browse Properties
                  </Link>
                </div>
            </div>
          )}
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <Link href="/invest">
              <div className="h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Invest in Properties</h2>
                    <p className="text-gray-300">Start your investment journey with fractional real estate ownership</p>
                  </div>
                  <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                    Explore Investment Options
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
              <Link href="/dashboard/portfolio">
              <div className="h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Portfolio Analytics</h2>
                      <p className="text-gray-300">View detailed performance metrics for your investment portfolio</p>
                  </div>
                  <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                      View Portfolio Performance
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
        </div>
      </ClientOnly>
      
      {/* Toast notifications */}
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