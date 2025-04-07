'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfileEdit() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    phone: '',
    walletAddress: '',
    email: ''
  });

  // Load user profile data
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setLoading(true);
      
      // Set email from Clerk user
      setProfileData(prev => ({
        ...prev,
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
      
      // Fetch user profile from database
      fetchUserProfile(user.id);
    } else if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.profile) {
        setProfileData({
          username: data.profile.username || '',
          phone: data.profile.phone || '',
          walletAddress: data.profile.walletAddress || '',
          email: data.profile.email || user?.primaryEmailAddress?.emailAddress || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerkId: user.id,
          data: profileData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Profile updated successfully!');
        // Redirect to dashboard after successful save
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Toaster position="top-right" />
      
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
          <Link href="/dashboard">
            <button className="text-blue-500 hover:text-blue-700">
              Back to Dashboard
            </button>
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileData.username}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">Email is managed by authentication provider and can't be changed here.</p>
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
              Wallet Address
            </label>
            <input
              type="text"
              id="walletAddress"
              name="walletAddress"
              value={profileData.walletAddress}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your wallet address"
            />
          </div>
          
          <div className="pt-4">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Profile'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
} 