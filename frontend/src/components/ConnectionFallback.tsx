import React from 'react';
import Link from 'next/link';

interface ConnectionFallbackProps {
  message: string;
  onRetry?: () => void;
  showBackButton?: boolean;
}

const ConnectionFallback: React.FC<ConnectionFallbackProps> = ({
  message,
  onRetry,
  showBackButton = true
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-4">Connection Issue</h2>
        
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {showBackButton && (
            <Link 
              href="/invest"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Return to Properties
            </Link>
          )}
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-white font-medium mb-2">If problems persist, try these steps:</h3>
          <ul className="text-gray-300 text-sm text-left list-disc pl-6 space-y-1">
            <li>Refresh the page and try again</li>
            <li>Make sure your MetaMask wallet is unlocked</li>
            <li>Check your internet connection</li>
            <li>Switch to a different browser</li>
            <li>Clear your browser cache and cookies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectionFallback; 