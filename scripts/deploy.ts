import pkg from "hardhat";
const { ethers, run, network } = pkg;

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

  // Verify on Basescan if not on localhost/hardhat
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    
    // Wait for a few block confirmations
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    
    console.log("🔍 Verifying contract on Basescan...");
    
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Basescan!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  Contract already verified");
      } else {
        console.log("⚠️  Verification failed:", error.message);
        console.log("   You can manually verify with:");
        console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
      }
    }
  }

  console.log("\n📋 Next steps:");
  console.log(`   1. Add to .env: NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Restart dev server: npm run dev");
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
