import { ethers, network } from "hardhat";

async function main() {
  console.log("Deploying FractionalProperty contract...");
  console.log("Network:", network.name);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // For Sepolia, we need to send ETH to the contract for the faucet
  const isTestnet = network.name === "sepolia";
  const contractFundingValue = isTestnet ? ethers.parseEther("0.05") : ethers.parseEther("0");
  
  // Deploy the FractionalProperty contract with initial ETH for the faucet if on testnet
  const FractionalProperty = await ethers.getContractFactory("FractionalProperty");
  const fractionalProperty = await FractionalProperty.deploy({ value: contractFundingValue });

  await fractionalProperty.waitForDeployment();
  const contractAddress = await fractionalProperty.getAddress();
  console.log("FractionalProperty deployed to:", contractAddress);

  // Add initial properties with simple values for testnet to make calculation straightforward
  console.log("Adding initial properties...");
  
  // Property 1: 1 share = 0.0001 ETH (10,000 shares = 1 ETH)
  await fractionalProperty.listProperty(
    "Luxury Apartment in Manhattan",
    "New York, NY",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    ethers.parseEther("0.001"), // 0.001 ETH total value
    10 // 10 shares (each share = 0.0001 ETH)
  );

  // Property 2: 1 share = 0.0001 ETH (20,000 shares = 2 ETH)
  await fractionalProperty.listProperty(
    "Beachfront Villa",
    "Miami, FL",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
    ethers.parseEther("0.002"), // 0.002 ETH total value
    20 // 20 shares (each share = 0.0001 ETH)
  );

  // Property 3: 1 share = 0.0001 ETH (30,000 shares = 3 ETH)
  await fractionalProperty.listProperty(
    "Modern Office Building",
    "San Francisco, CA",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    ethers.parseEther("0.003"), // 0.003 ETH total value
    30 // 30 shares (each share = 0.0001 ETH)
  );

  // Property 4: 1 share = 0.0001 ETH (8,000 shares = 0.8 ETH)
  await fractionalProperty.listProperty(
    "Mountain Retreat Lodge",
    "Aspen, CO",
    "https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=800",
    ethers.parseEther("0.0008"), // 0.0008 ETH total value
    8 // 8 shares (each share = 0.0001 ETH)
  );

  // Property 5: 1 share = 0.0001 ETH (12,000 shares = 1.2 ETH)
  await fractionalProperty.listProperty(
    "Waterfront Condo",
    "Seattle, WA",
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800",
    ethers.parseEther("0.0012"), // 0.0012 ETH total value
    12 // 12 shares (each share = 0.0001 ETH)
  );

  console.log("Added 5 initial properties to the contract");
  console.log("Each share costs exactly 0.0001 ETH for easy calculation");
  
  // Print information for updating frontend config
  console.log("-------------------------------------------");
  console.log("IMPORTANT: Update your frontend configuration");
  console.log("In frontend/src/config.ts, set CONTRACT_ADDRESS to:", contractAddress);
  console.log("-------------------------------------------");
  
  console.log("FractionalProperty setup complete!");
}

// Run the deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 