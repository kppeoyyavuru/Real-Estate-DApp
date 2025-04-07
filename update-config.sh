#!/bin/bash

echo "===== Contract Address Updater ====="
echo

read -p "Enter your deployed contract address (e.g., 0x123...): " CONTRACT_ADDRESS

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Error: No contract address provided"
  exit 1
fi

echo
echo "Updating configuration file..."

# Use sed to replace the contract address in config.ts
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS uses different sed syntax
  sed -i '' "s/0x5FbDB2315678afecb367f032d93F642f64180aa3/$CONTRACT_ADDRESS/g" frontend/src/config.ts
else
  # Linux and others
  sed -i "s/0x5FbDB2315678afecb367f032d93F642f64180aa3/$CONTRACT_ADDRESS/g" frontend/src/config.ts
fi

if [ $? -ne 0 ]; then
  echo "Failed to update config file."
  exit 1
fi

echo
echo "Configuration updated successfully!"
echo
echo "Your contract address $CONTRACT_ADDRESS has been set in frontend/src/config.ts"
echo

read -p "Would you like to start the frontend server now? (y/n): " START_SERVER

if [[ $START_SERVER == "y" || $START_SERVER == "Y" ]]; then
  echo "Starting frontend..."
  cd frontend && npm run dev
else
  echo
  echo "To start the frontend manually, run:"
  echo "cd frontend && npm run dev"
  echo
fi 