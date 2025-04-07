import { expect } from "chai";
import { ethers } from "hardhat";
import { FractionalProperty } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FractionalProperty", function () {
  let fractionalProperty: FractionalProperty;
  let owner: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;
  let investor3: HardhatEthersSigner;
  
  // Property data for testing
  const propertyName = "Test Property";
  const propertyLocation = "Test Location";
  const propertyImageUrl = "https://example.com/image.jpg";
  const propertyValue = ethers.parseEther("100"); // 100 ETH
  const totalShares = 10000;

  beforeEach(async function () {
    // Get signers (accounts)
    [owner, investor1, investor2, investor3] = await ethers.getSigners();
    
    // Deploy contract
    const FractionalPropertyFactory = await ethers.getContractFactory("FractionalProperty");
    fractionalProperty = await FractionalPropertyFactory.deploy();
    
    // List a property for testing
    await fractionalProperty.listProperty(
      propertyName,
      propertyLocation,
      propertyImageUrl,
      propertyValue,
      totalShares
    );
  });

  describe("Property Listing", function () {
    it("should list a property correctly", async function () {
      const property = await fractionalProperty.properties(0);
      
      expect(property.id).to.equal(0);
      expect(property.name).to.equal(propertyName);
      expect(property.location).to.equal(propertyLocation);
      expect(property.imageUrl).to.equal(propertyImageUrl);
      expect(property.totalValue).to.equal(propertyValue);
      expect(property.totalShares).to.equal(totalShares);
      expect(property.sharesIssued).to.equal(0);
      expect(property.active).to.be.true;
    });
    
    it("should increment property count", async function () {
      expect(await fractionalProperty.propertyCount()).to.equal(1);
      
      // List another property
      await fractionalProperty.listProperty(
        "Second Property",
        "Another Location",
        "https://example.com/image2.jpg",
        ethers.parseEther("200"),
        20000
      );
      
      expect(await fractionalProperty.propertyCount()).to.equal(2);
    });
    
    it("should revert if non-owner tries to list a property", async function () {
      await expect(
        fractionalProperty.connect(investor1).listProperty(
          propertyName,
          propertyLocation,
          propertyImageUrl,
          propertyValue,
          totalShares
        )
      ).to.be.revertedWithCustomError(fractionalProperty, "OwnableUnauthorizedAccount");
    });
  });

  describe("Property Investment", function () {
    it("should allow investment in a property", async function () {
      const investmentAmount = ethers.parseEther("10"); // 10 ETH
      const expectedShares = (investmentAmount * BigInt(totalShares)) / propertyValue; // 1000 shares
      
      await fractionalProperty.connect(investor1).invest(0, { value: investmentAmount });
      
      // Check property state
      const property = await fractionalProperty.properties(0);
      expect(property.sharesIssued).to.equal(expectedShares);
      
      // Check investor shares
      const investorShares = await fractionalProperty.shares(0, investor1.address);
      expect(investorShares).to.equal(expectedShares);
      
      // Check total investments
      const totalInvestments = await fractionalProperty.totalInvestments(0);
      expect(totalInvestments).to.equal(investmentAmount);
    });
    
    it("should calculate shares correctly for different investment amounts", async function () {
      // First investor: 25 ETH = 2500 shares (25% ownership)
      const investment1 = ethers.parseEther("25");
      await fractionalProperty.connect(investor1).invest(0, { value: investment1 });
      
      // Second investor: 10 ETH = 1000 shares (10% ownership)
      const investment2 = ethers.parseEther("10");
      await fractionalProperty.connect(investor2).invest(0, { value: investment2 });
      
      // Check investor shares
      const investorShares1 = await fractionalProperty.shares(0, investor1.address);
      const investorShares2 = await fractionalProperty.shares(0, investor2.address);
      
      expect(investorShares1).to.equal((investment1 * BigInt(totalShares)) / propertyValue);
      expect(investorShares2).to.equal((investment2 * BigInt(totalShares)) / propertyValue);
      
      // Check property state
      const property = await fractionalProperty.properties(0);
      expect(property.sharesIssued).to.equal(investorShares1 + investorShares2);
    });
    
    it("should revert if investment amount is 0", async function () {
      await expect(
        fractionalProperty.connect(investor1).invest(0, { value: 0 })
      ).to.be.revertedWith("Investment must be greater than 0");
    });
    
    it("should revert if trying to invest in non-existent property", async function () {
      const investmentAmount = ethers.parseEther("10");
      await expect(
        fractionalProperty.connect(investor1).invest(999, { value: investmentAmount })
      ).to.be.reverted;
    });
    
    it("should deactivate property when all shares are issued", async function () {
      // Fully fund the property
      await fractionalProperty.connect(investor1).invest(0, { value: propertyValue });
      
      // Check property state
      const property = await fractionalProperty.properties(0);
      expect(property.active).to.be.false;
      expect(property.sharesIssued).to.equal(totalShares);
      
      // Should revert if trying to invest after property is fully funded
      await expect(
        fractionalProperty.connect(investor2).invest(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Property is not active");
    });
    
    it("should reject investments that would exceed available shares", async function () {
      // First investor: 90 ETH = 9000 shares
      await fractionalProperty.connect(investor1).invest(0, { value: ethers.parseEther("90") });
      
      // Second investor: trying to invest 15 ETH (which would exceed total shares)
      await expect(
        fractionalProperty.connect(investor2).invest(0, { value: ethers.parseEther("15") })
      ).to.be.revertedWith("Not enough shares available");
      
      // But should accept a smaller investment that doesn't exceed shares
      await fractionalProperty.connect(investor2).invest(0, { value: ethers.parseEther("10") });
    });
  });

  describe("Property Queries", function () {
    it("should return all properties", async function () {
      // List a second property
      await fractionalProperty.listProperty(
        "Second Property",
        "Another Location",
        "https://example.com/image2.jpg",
        ethers.parseEther("200"),
        20000
      );
      
      const allProperties = await fractionalProperty.getAllProperties();
      expect(allProperties.length).to.equal(2);
      expect(allProperties[0].name).to.equal(propertyName);
      expect(allProperties[1].name).to.equal("Second Property");
    });
    
    it("should return only active properties", async function () {
      // List a second property
      await fractionalProperty.listProperty(
        "Second Property",
        "Another Location",
        "https://example.com/image2.jpg",
        ethers.parseEther("200"),
        20000
      );
      
      // Fully fund the first property to make it inactive
      await fractionalProperty.connect(investor1).invest(0, { value: propertyValue });
      
      // Get active properties
      const activeProperties = await fractionalProperty.getActiveProperties();
      expect(activeProperties.length).to.equal(1);
      expect(activeProperties[0].name).to.equal("Second Property");
    });
    
    it("should calculate ownership percentage correctly", async function () {
      // First investor: 25 ETH = 2500 shares (25% ownership)
      await fractionalProperty.connect(investor1).invest(0, { value: ethers.parseEther("25") });
      
      // Check ownership percentage (multiplied by 10000 in the contract)
      const ownershipPercentage = await fractionalProperty.getUserOwnershipPercentage(0, investor1.address);
      expect(ownershipPercentage).to.equal(2500); // 25.00%
    });
  });
}); 