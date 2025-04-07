#!/usr/bin/env node

/**
 * Cross-platform deployment script for the Real Estate DApp
 * Works on Windows, Mac, and Linux
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('===== Real Estate DApp Sepolia Deployment =====\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('ERROR: .env file not found');
  console.error('Please create a .env file with your PRIVATE_KEY');
  process.exit(1);
}

// Read the .env file
const envContent = fs.readFileSync('.env', 'utf8');

// Check if private key has the default value
if (envContent.includes('YOUR_SEPOLIA_PRIVATE_KEY_HERE')) {
  console.error('ERROR: You need to update your .env file with your actual private key');
  console.error('Your PRIVATE_KEY still has the default value.');
  console.error('');
  console.error('Please open the .env file and replace YOUR_SEPOLIA_PRIVATE_KEY_HERE');
  console.error('with your actual private key (without the 0x prefix)');
  process.exit(1);
}

// Check if private key includes 0x prefix
if (envContent.includes('PRIVATE_KEY=0x')) {
  console.error('ERROR: Your private key should NOT include the 0x prefix');
  console.error('Please edit your .env file and remove the 0x from the beginning');
  process.exit(1);
}

console.log('Deploying contract to Sepolia...');
console.log('This may take a minute...\n');

// Deploy the contract
try {
  const output = execSync('npx hardhat run scripts/deploy.ts --network sepolia', { encoding: 'utf8' });
  console.log(output);
  
  // Extract the contract address from the output
  const match = output.match(/FractionalProperty deployed to: (0x[a-fA-F0-9]{40})/);
  const contractAddress = match ? match[1] : null;
  
  console.log('\n===== IMPORTANT =====');
  console.log('Copy the contract address from above and update it in:');
  console.log('frontend/src/config.ts');
  
  // If we found the contract address, offer to update the config automatically
  if (contractAddress) {
    rl.question('\nWould you like to update the config file automatically? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        updateConfig(contractAddress);
      } else {
        console.log('\nPlease update the contract address manually.');
        console.log('After updating, run: cd frontend && npm run dev');
        rl.close();
      }
    });
  } else {
    console.log('\nCould not automatically detect the contract address.');
    console.log('Please make sure to copy it from the output above.');
    console.log('After updating the address, run: cd frontend && npm run dev');
    rl.close();
  }
} catch (error) {
  console.error('\nDeployment failed! Check the error above.');
  console.error('\nCommon issues:');
  console.error('1. Make sure you have Sepolia ETH in your wallet');
  console.error('2. Check that your private key is correct');
  console.error('3. Ensure you\'re connected to the internet');
  process.exit(1);
}

function updateConfig(contractAddress) {
  try {
    console.log(`\nUpdating config with address: ${contractAddress}`);
    
    // Read the config file
    const configPath = 'frontend/src/config.ts';
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Replace the contract address
    configContent = configContent.replace(
      /export const CONTRACT_ADDRESS = '(0x[a-fA-F0-9]{40})'/,
      `export const CONTRACT_ADDRESS = '${contractAddress}'`
    );
    
    // Write the updated config back to the file
    fs.writeFileSync(configPath, configContent);
    
    console.log('Config file updated successfully!');
    
    rl.question('\nWould you like to start the frontend now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nStarting the frontend...');
        try {
          execSync('cd frontend && npm run dev', { stdio: 'inherit' });
        } catch (error) {
          // The frontend is running, ignore any error when exiting
        }
      } else {
        console.log('\nTo start the frontend manually, run: cd frontend && npm run dev');
      }
      rl.close();
    });
  } catch (error) {
    console.error('Error updating config file:', error.message);
    console.error('Please update the contract address manually in frontend/src/config.ts');
    rl.close();
  }
} 