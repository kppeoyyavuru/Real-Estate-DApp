import React from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_NETWORK } from '../config';

interface TransactionConfirmationProps {
  isOpen: boolean;
  isPending: boolean;
  isSuccess: boolean;
  error: string;
  txHash: string;
  onClose: () => void;
}

const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  isOpen,
  isPending,
  isSuccess,
  error,
  txHash,
  onClose
}) => {
  if (!isOpen) return null;

  const getExplorerLink = () => {
    if (!txHash) return '#';
    const baseUrl = DEFAULT_NETWORK.blockExplorer;
    if (!baseUrl) return '#';
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800/90 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl"
      >
        <div className="text-center">
          {isPending && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Pending</h3>
              <p className="text-gray-400 mb-4">
                Your transaction is being processed on the blockchain. This may take a few moments.
              </p>
              {txHash && (
                <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Transaction Hash:</p>
                  <p className="text-blue-400 text-sm font-mono break-all hover:underline">
                    <a href={getExplorerLink()} target="_blank" rel="noopener noreferrer">
                      {txHash}
                    </a>
                  </p>
                </div>
              )}
            </>
          )}

          {isSuccess && !isPending && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Successful!</h3>
              <p className="text-gray-400 mb-4">
                Your transaction has been confirmed on the blockchain.
              </p>
              {txHash && (
                <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Transaction Hash:</p>
                  <p className="text-blue-400 text-sm font-mono break-all hover:underline">
                    <a href={getExplorerLink()} target="_blank" rel="noopener noreferrer">
                      {txHash}
                    </a>
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity w-full"
              >
                Close
              </button>
            </>
          )}

          {error && !isPending && !isSuccess && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-red-500/20 rounded-full p-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Failed</h3>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors w-full"
              >
                Close
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionConfirmation; 