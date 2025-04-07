#!/bin/bash

echo "===== Real Estate DApp Sepolia Deployment ====="
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found"
  echo "Please create a .env file with your PRIVATE_KEY"
  exit 1
fi

# Check if private key has the default value
if grep -q "YOUR_SEPOLIA_PRIVATE_KEY_HERE" .env; then
  echo "ERROR: You need to update your .env file with your actual private key"
  echo "Your PRIVATE_KEY still has the default value."
  echo
  echo "Please open the .env file and replace YOUR_SEPOLIA_PRIVATE_KEY_HERE"
  echo "with your actual private key (without the 0x prefix)"
  exit 1
fi

# Check if private key includes 0x prefix
if grep -q "PRIVATE_KEY=0x" .env; then
  echo "ERROR: Your private key should NOT include the 0x prefix"
  echo "Please edit your .env file and remove the 0x from the beginning"
  exit 1
fi

echo "Deploying contract to Sepolia..."
echo "This may take a minute..."
echo

npx hardhat run scripts/deploy.ts --network sepolia

if [ $? -ne 0 ]; then
  echo
  echo "Deployment failed! Check the error above."
  echo
  echo "Common issues:"
  echo "1. Make sure you have Sepolia ETH in your wallet"
  echo "2. Check that your private key is correct"
  echo "3. Ensure you're connected to the internet"
  exit 1
fi

echo
echo "===== IMPORTANT ====="
echo "Copy the contract address from above and update it in:"
echo "frontend/src/config.ts"
echo
echo "After updating the address, run: cd frontend && npm run dev"
echo 