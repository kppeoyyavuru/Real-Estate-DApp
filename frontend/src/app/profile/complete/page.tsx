'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { updateUserProfile } from '../../../../server/index';

export default function CompleteProfile() {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    walletAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.emailAddresses[0]) {
      setFormData(prev => ({
        ...prev,
        email: user.emailAddresses[0].emailAddress
      }));
    }
  }, [user]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setFormData(prev => ({ ...prev, walletAddress: address }));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile(user?.id!, {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        walletAddress: formData.walletAddress
      });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Complete Your Profile</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-400"
              value={formData.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Wallet Address
            </label>
            <div className="mt-1 flex gap-3">
              <input
                type="text"
                readOnly
                className="block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-400"
                value={formData.walletAddress}
                placeholder="Connect your wallet"
              />
              <button
                type="button"
                onClick={connectWallet}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
} 