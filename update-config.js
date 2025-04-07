#!/usr/bin/env node

/**
 * Cross-platform config updater for the Real Estate DApp
 * Works on Windows, Mac, and Linux
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('===== Contract Address Updater =====\n');

rl.question('Enter your deployed contract address (e.g., 0x123...): ', (contractAddress) => {
  if (!contractAddress) {
    console.error('Error: No contract address provided');
    rl.close();
    return;
  }

  console.log('\nUpdating configuration file...');
  
  try {
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
    
    console.log('Configuration updated successfully!');
    console.log(`\nYour contract address ${contractAddress} has been set in frontend/src/config.ts`);
    
    rl.question('\nWould you like to start the frontend server now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\nStarting frontend...');
        const { execSync } = require('child_process');
        try {
          execSync('cd frontend && npm run dev', { stdio: 'inherit' });
        } catch (error) {
          // The frontend is running, ignore any error when exiting
        }
      } else {
        console.log('\nTo start the frontend manually, run:');
        console.log('cd frontend && npm run dev');
      }
      rl.close();
    });
  } catch (error) {
    console.error('Error updating config file:', error.message);
    console.error('Please update the contract address manually in frontend/src/config.ts');
    rl.close();
  }
}); 