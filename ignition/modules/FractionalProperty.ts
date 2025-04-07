import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FractionalPropertyModule = buildModule("FractionalPropertyModule", (m) => {
  const fractionalProperty = m.contract("FractionalProperty");

  // Add initial properties after deployment
  m.afterDeploy(fractionalProperty, async (contract) => {
    // Property 1
    await contract.listProperty(
      "Luxury Apartment in Manhattan",
      "New York, NY",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      ethers.parseEther("100"), // 100 ETH total value
      10000 // 10,000 shares
    );

    // Property 2
    await contract.listProperty(
      "Beachfront Villa",
      "Miami, FL",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
      ethers.parseEther("200"), // 200 ETH total value
      20000 // 20,000 shares
    );

    // Property 3
    await contract.listProperty(
      "Modern Office Building",
      "San Francisco, CA",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      ethers.parseEther("300"), // 300 ETH total value
      30000 // 30,000 shares
    );

    // Property 4
    await contract.listProperty(
      "Mountain Retreat Lodge",
      "Aspen, CO",
      "https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=800",
      ethers.parseEther("80"), // 80 ETH total value
      8000 // 8,000 shares
    );

    // Property 5
    await contract.listProperty(
      "Waterfront Condo",
      "Seattle, WA",
      "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800",
      ethers.parseEther("120"), // 120 ETH total value
      12000 // 12,000 shares
    );

    console.log("Added 5 initial properties to the contract");
  });

  return { fractionalProperty };
});

export default FractionalPropertyModule; 