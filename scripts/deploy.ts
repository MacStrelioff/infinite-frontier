import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying InfiniteFrontier contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const InfiniteFrontier = await ethers.getContractFactory("InfiniteFrontier");
  const contract = await InfiniteFrontier.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ InfiniteFrontier deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log(`   1. Add to .env: NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Verify on Basescan (optional):");
  console.log(`      npx hardhat verify --network <network> ${contractAddress}`);
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

