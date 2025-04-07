// Configuration for the application
// Update this file with the deployed contract address after running the deployment script

// Default contract address - this should be updated with your Sepolia deployed contract address
// IMPORTANT: Replace this with your actual deployed contract address after deployment
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Network configurations
export const NETWORK_CONFIG = {
  // Localhost/Hardhat node
  localhost: {
    chainId: '0x7a69', // 31337 in hex (lowercase to match MetaMask)
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Localhost',
    blockExplorer: '',
  },
  // Ethereum Sepolia testnet
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura ID (or replace with your own)
    name: 'Sepolia Testnet',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  // Add more networks as needed
};

// Load configuration based on environment from environment variables or defaults

export const DEFAULT_NETWORK = {
  name: "Sepolia Testnet",
  chainId: "11155111", // Changed to string for toLowerCase compatibility
  chainIdHex: "0xaa36a7", // Sepolia chainId in hex
  rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  blockExplorer: "https://sepolia.etherscan.io/"
};

// Configuration for transaction settings
export const TRANSACTION_SETTINGS = {
  gasLimit: 1000000, // Reduced gas limit to save ETH
  gasPrice: undefined, // Will use the network's recommended gas price
  maxFeePerGas: undefined, // For EIP-1559 transactions
  maxPriorityFeePerGas: undefined, // For EIP-1559 transactions
  confirmations: 1, // Number of confirmations to wait for
  transactionTimeout: 60000, // 60 seconds timeout for transaction submission
};

// Performance settings for wallet connections
export const PERFORMANCE_SETTINGS = {
  connectionTimeout: 60000, // 60 seconds - increased for public testnet
  contractCallTimeout: 30000, // 30 seconds - increased for public testnet
  retryAttempts: 2, // Reduced to save gas on failed attempts
  retryDelay: 2000, // 2 seconds between retries
  usePolling: false,
  initialDelay: 1000, // 1 second initial delay
  asyncInitialization: true,
  skipContractVerification: false, // Enable contract verification for real investments
  useImmediateLoading: true,
  fastPropertyLoading: false, // Disabled to allow real blockchain interaction
  useDemoMode: false, // Explicitly disable demo mode
};

// Application settings
export const APP_SETTINGS = {
  defaultInvestmentAmount: '0.0001', // Very small default investment (0.0001 ETH)
  decimalsToShow: 6, // Increased to show smaller amounts clearly
  defaultPollingInterval: 15000, // Increased to reduce API calls to Sepolia
  transactionTimeout: 120000, // Milliseconds to wait for transaction confirmation
  useLocalStorage: true, // Cache data in localStorage for faster loading
  useDemoDataFallback: false, // Disabled - use real data only
  enableRealInvestments: true, // New setting to enable real investments
  maxInvestmentAmount: '0.05', // Maximum investment amount (use 0.05 ETH as max)
  minInvestmentAmount: '0.00001', // Extremely low minimum investment (0.00001 ETH)
  economyMode: true, // New flag to indicate we're being economical with gas
};

export default {
  CONTRACT_ADDRESS,
  NETWORK_CONFIG,
  DEFAULT_NETWORK,
  TRANSACTION_SETTINGS,
  PERFORMANCE_SETTINGS,
  APP_SETTINGS,
}; 