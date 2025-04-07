# Cross-Platform Deployment Guide

This guide works for Windows, macOS, and Linux systems.

## Step 1: Set up your Private Key

1. Open the `.env` file in the root directory
2. Replace `YOUR_SEPOLIA_PRIVATE_KEY_HERE` with your actual private key
   - **IMPORTANT**: Remove the `0x` prefix if your key has one
   - Example: If your key is `0xabcd1234...`, enter only `abcd1234...`

## Step 2: Get Sepolia ETH

1. Make sure your wallet has some Sepolia ETH
2. If needed, get free test ETH from:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Faucet](https://www.infura.io/faucet/sepolia)

## Step 3: Deploy Your Contract

### Option 1: Using NPM (Recommended - Works on all platforms)

```bash
npm run deploy
```

This will:
- Deploy your contract to Sepolia
- Offer to update your config automatically
- Optionally start your frontend

### Option 2: Using platform-specific scripts

**Windows:**
```
deploy-to-sepolia.bat
```

**macOS/Linux:**
```bash
# First make the script executable
chmod +x deploy.sh

# Then run it
./deploy.sh
```

After deployment, update your config:

**Windows:**
```
update-config.bat
```

**macOS/Linux:**
```bash
# First make the script executable
chmod +x update-config.sh

# Then run it
./update-config.sh
```

## Step 4: Start Your Application

```bash
cd frontend
npm run dev
```

## Troubleshooting

- **Deployment fails**: Make sure you have Sepolia ETH and the correct private key
- **Investments don't show up**: Verify you're connected to Sepolia network in MetaMask
- **MetaMask errors**: Refresh the page and try reconnecting your wallet
- **Permission errors on Unix**: Make sure to run `chmod +x` on the shell scripts 