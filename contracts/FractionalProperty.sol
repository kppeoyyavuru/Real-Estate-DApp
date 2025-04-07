// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FractionalProperty
 * @dev Contract for managing fractional ownership of properties
 */
contract FractionalProperty is Ownable, ReentrancyGuard {
    struct Property {
        uint256 id;
        string name;
        string location;
        string imageUrl;
        uint256 totalValue; // Total value in wei
        uint256 totalShares; // Total shares available
        uint256 sharesIssued; // Shares already issued
        bool active; // If property is still available for investment
    }

    // Property ID => Property details
    mapping(uint256 => Property) public properties;
    
    // Property ID => Investor address => Shares owned
    mapping(uint256 => mapping(address => uint256)) public shares;
    
    // Property ID => Total investments (in wei)
    mapping(uint256 => uint256) public totalInvestments;
    
    uint256 public propertyCount;
    
    event PropertyListed(uint256 indexed propertyId, string name, uint256 totalValue, uint256 totalShares);
    event InvestmentMade(uint256 indexed propertyId, address indexed investor, uint256 amount, uint256 sharesIssued);
    event PropertyDeactivated(uint256 indexed propertyId);
    event FaucetFundsReceived(address recipient, uint256 amount);
    
    constructor() Ownable() payable {
        // Constructor now accepts ETH
    }
    
    // Add a fundFaucet function for contract owner to add funds
    function fundFaucet() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH to fund the faucet");
    }
    
    // Add a faucet function for testing
    function getFaucetFunds() external {
        require(address(this).balance >= 1 ether, "Faucet is empty");
        // Send 1 ETH to the caller for testing purposes
        payable(msg.sender).transfer(1 ether);
        emit FaucetFundsReceived(msg.sender, 1 ether);
    }
    
    /**
     * @dev List a new property for fractional investment
     */
    function listProperty(
        string memory _name,
        string memory _location,
        string memory _imageUrl,
        uint256 _totalValue,
        uint256 _totalShares
    ) external onlyOwner {
        require(_totalValue > 0, "Value must be greater than 0");
        require(_totalShares > 0, "Shares must be greater than 0");
        
        uint256 propertyId = propertyCount;
        
        properties[propertyId] = Property({
            id: propertyId,
            name: _name,
            location: _location,
            imageUrl: _imageUrl,
            totalValue: _totalValue,
            totalShares: _totalShares,
            sharesIssued: 0,
            active: true
        });
        
        propertyCount++;
        
        emit PropertyListed(propertyId, _name, _totalValue, _totalShares);
    }
    
    /**
     * @dev Invest in a property and receive fractional ownership
     */
    function invest(uint256 _propertyId) external payable nonReentrant {
        Property storage property = properties[_propertyId];
        
        require(property.active, "Property is not active");
        require(msg.value > 0, "Investment must be greater than 0");
        
        // Calculate shares to be issued based on investment amount
        uint256 sharesIssued = (msg.value * property.totalShares) / property.totalValue;
        
        require(property.sharesIssued + sharesIssued <= property.totalShares, "Not enough shares available");
        
        // Update property state
        property.sharesIssued += sharesIssued;
        totalInvestments[_propertyId] += msg.value;
        
        // Update investor shares
        shares[_propertyId][msg.sender] += sharesIssued;
        
        // If all shares are issued, mark property as inactive
        if (property.sharesIssued >= property.totalShares) {
            property.active = false;
            emit PropertyDeactivated(_propertyId);
        }
        
        emit InvestmentMade(_propertyId, msg.sender, msg.value, sharesIssued);
    }
    
    /**
     * @dev Get all properties
     */
    function getAllProperties() external view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyCount);
        
        for (uint256 i = 0; i < propertyCount; i++) {
            allProperties[i] = properties[i];
        }
        
        return allProperties;
    }
    
    /**
     * @dev Get active properties only
     */
    function getActiveProperties() external view returns (Property[] memory) {
        uint256 activeCount = 0;
        
        // Count active properties
        for (uint256 i = 0; i < propertyCount; i++) {
            if (properties[i].active) {
                activeCount++;
            }
        }
        
        Property[] memory activeProperties = new Property[](activeCount);
        uint256 index = 0;
        
        // Fill active properties array
        for (uint256 i = 0; i < propertyCount; i++) {
            if (properties[i].active) {
                activeProperties[index] = properties[i];
                index++;
            }
        }
        
        return activeProperties;
    }
    
    /**
     * @dev Get a user's investments in a specific property
     */
    function getUserInvestment(uint256 _propertyId, address _user) external view returns (uint256) {
        return shares[_propertyId][_user];
    }
    
    /**
     * @dev Get a user's ownership percentage in a property
     */
    function getUserOwnershipPercentage(uint256 _propertyId, address _user) external view returns (uint256) {
        uint256 userShares = shares[_propertyId][_user];
        Property memory property = properties[_propertyId];
        
        if (userShares == 0 || property.totalShares == 0) {
            return 0;
        }
        
        // Return percentage multiplied by 100 for better precision (e.g., 10.5% = 1050)
        return (userShares * 10000) / property.totalShares;
    }
} 