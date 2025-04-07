'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ethers } from 'ethers';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FractionalPropertyABI from '../../../abi/FractionalProperty.json';

// Contract address of the deployed FractionalProperty contract
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with actual deployment address

type Property = {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  totalValue: bigint;
  totalShares: bigint;
  sharesIssued: bigint;
  active: boolean;
  userShares: bigint;
  userPercentage: number;
  estimatedValue: bigint;
};

export default function InvestmentsPage() {
  const { user, isSignedIn } = useUser();
  const [investments, setInvestments] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [totalInvestmentValue, setTotalInvestmentValue] = useState<bigint>(BigInt(0));

  // Connect wallet and fetch user investments
  useEffect(() => {
    const connectWalletAndFetchData = async () => {
      try {
        if (!window.ethereum) {
          setError('MetaMask is not installed. Please install it to use this feature.');
          setLoading(false);
          return;
        }

        // Connect to MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setWalletConnected(true);

        // Connect to the contract
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          FractionalPropertyABI,
          signer
        );

        // Fetch all properties
        const allProperties = await contract.getAllProperties();
        
        // Filter and transform properties to include user investment details
        const userInvestments = [];
        let portfolioTotalValue = BigInt(0);

        for (const property of allProperties) {
          const propertyId = Number(property.id);
          const userShares = await contract.getUserInvestment(propertyId, userAddress);
          
          // Only include properties where the user has shares
          if (userShares > 0) {
            const totalShares = BigInt(property.totalShares);
            // Calculate user's percentage ownership (as a decimal)
            const userPercentage = Number((userShares * BigInt(10000)) / totalShares) / 100;
            
            // Calculate estimated value of user's shares
            const propertyTotalValue = BigInt(property.totalValue);
            const estimatedValue = (propertyTotalValue * userShares) / totalShares;
            
            userInvestments.push({
              id: propertyId,
              name: property.name,
              location: property.location,
              imageUrl: property.imageUrl,
              totalValue: BigInt(property.totalValue),
              totalShares: BigInt(property.totalShares),
              sharesIssued: BigInt(property.sharesIssued),
              active: property.active,
              userShares,
              userPercentage,
              estimatedValue
            });
            
            portfolioTotalValue += estimatedValue;
          }
        }

        setInvestments(userInvestments);
        setTotalInvestmentValue(portfolioTotalValue);
      } catch (err: any) {
        console.error('Error fetching investments:', err);
        setError(err.message || 'Failed to load investment data');
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      connectWalletAndFetchData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please sign in to view your investments.</p>
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
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Your Investments</h1>
          <p className="mt-2 text-gray-400">Track your real estate portfolio and investment performance</p>
        </div>

        {/* Wallet Connection Status */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${walletConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <h2 className="text-xl font-bold text-white">Wallet Status</h2>
              </div>
              <p className="text-gray-400 mt-1">
                {walletConnected 
                  ? "Your wallet is connected. You can view your investments."
                  : "Please connect your wallet to view your investments."}
              </p>
            </div>
            {walletConnected && totalInvestmentValue > 0 && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Portfolio Value</p>
                <p className="text-white text-xl font-bold">{ethers.formatEther(totalInvestmentValue)} ETH</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Investment List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : investments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investments.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50"
              >
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={property.imageUrl} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white">{property.name}</h3>
                    <p className="text-gray-300">{property.location}</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Your Shares</p>
                      <p className="text-white font-medium">{Number(property.userShares).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Ownership</p>
                      <p className="text-white font-medium">{property.userPercentage.toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Value</p>
                      <p className="text-white font-medium">{ethers.formatEther(property.estimatedValue)} ETH</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Status</p>
                      <p className={`font-medium ${property.active ? 'text-green-400' : 'text-blue-400'}`}>
                        {property.active ? 'Active' : 'Fully Funded'}
                      </p>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/invest/${property.id}`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-center hover:opacity-90 transition-opacity"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : walletConnected ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-blue-500/20">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Investments Found</h2>
            <p className="text-gray-400 mb-6">You haven't invested in any properties yet.</p>
            <Link 
              href="/invest"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg inline-block hover:opacity-90 transition-opacity"
            >
              Explore Investment Opportunities
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-yellow-500/20">
              <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Please connect your wallet to view your investments.</p>
          </div>
        )}
      </div>
    </div>
  );
} 