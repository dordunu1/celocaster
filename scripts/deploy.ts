const { ethers } = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  console.log("Starting deployment...");

  // Get price feed addresses from environment variables
  const btcFeed = process.env.NEXT_PUBLIC_CHAINLINK_BTC_USD_FEED;
  const ethFeed = process.env.NEXT_PUBLIC_CHAINLINK_ETH_USD_FEED;
  const celoFeed = process.env.NEXT_PUBLIC_CHAINLINK_CELO_USD_FEED;

  if (!btcFeed || !ethFeed) {
    throw new Error("Missing price feed addresses in environment variables");
  }

  // Validate addresses
  if (!ethers.utils.isAddress(btcFeed) || !ethers.utils.isAddress(ethFeed) || !ethers.utils.isAddress(celoFeed)) {
    throw new Error("Invalid price feed addresses in environment variables");
  }

  console.log('Deploy script - RPC_URL:', process.env.NEXT_PUBLIC_CELO_RPC_1);
  console.log('Deploy script - PRIVATE_KEY:', process.env.PRIVATE_KEY);

  // Deploy Celocaster contract
  console.log("\nDeploying Celocaster contract...");
  const Celocaster = await ethers.getContractFactory("contracts/Celocaster.sol:Celocaster");
  const celocaster = await Celocaster.deploy(
    ["BTC", "ETH", "CELO"],
    [btcFeed, ethFeed, celoFeed]
  );

  await celocaster.deployed();
  console.log(`Celocaster deployed to: ${celocaster.address}`);

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`BTC/USD Price Feed: ${btcFeed}`);
  console.log(`ETH/USD Price Feed: ${ethFeed}`);
  console.log(`CELO/USD Price Feed: ${celoFeed}`);
  console.log(`Celocaster: ${celocaster.address}`);

  // Save deployment addresses for frontend
  console.log("\nSaving deployment addresses...");
  const deploymentInfo = {
    btcUsdFeed: btcFeed,
    ethUsdFeed: ethFeed,
    celoUsdFeed: celoFeed,
    celocaster: celocaster.address,
    chainId: process.env.NEXT_PUBLIC_CELO_CHAIN_ID,
    network: "celo-mainnet"
  };

  // Write deployment info to a file
  const fs = require("fs");
  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nVerification command:");
  console.log("==================");
  console.log(`npx hardhat verify --network celo ${celocaster.address} ["BTC","ETH","CELO"] ["${btcFeed}","${ethFeed}","${celoFeed}"]`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 