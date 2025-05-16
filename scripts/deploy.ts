const { ethers } = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  console.log("Starting deployment...");

  // Get price feed addresses from environment variables
  const btcFeed = process.env.NEXT_PUBLIC_CHAINLINK_BTC_USD_FEED;
  const ethFeed = process.env.NEXT_PUBLIC_CHAINLINK_ETH_USD_FEED;

  if (!btcFeed || !ethFeed) {
    throw new Error("Missing price feed addresses in environment variables");
  }

  // Validate addresses
  if (!ethers.utils.isAddress(btcFeed) || !ethers.utils.isAddress(ethFeed)) {
    throw new Error("Invalid price feed addresses in environment variables");
  }

  console.log('Deploy script - RPC_URL:', process.env.NEXT_PUBLIC_CELO_RPC_1);
  console.log('Deploy script - PRIVATE_KEY:', process.env.PRIVATE_KEY);

  // Deploy Betcaster contract
  console.log("\nDeploying Betcaster contract...");
  const Betcaster = await ethers.getContractFactory("Betcaster");
  const betcaster = await Betcaster.deploy(
    ["BTC", "ETH"],
    [btcFeed, ethFeed]
  );

  await betcaster.deployed();
  console.log(`Betcaster deployed to: ${betcaster.address}`);

  // Deploy BetcasterAutomation contract
  console.log("\nDeploying BetcasterAutomation contract...");
  const BetcasterAutomation = await ethers.getContractFactory("BetcasterAutomation");
  const automation = await BetcasterAutomation.deploy(betcaster.address);

  await automation.deployed();
  console.log(`BetcasterAutomation deployed to: ${automation.address}`);

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`BTC/USD Price Feed: ${btcFeed}`);
  console.log(`ETH/USD Price Feed: ${ethFeed}`);
  console.log(`Betcaster: ${betcaster.address}`);
  console.log(`BetcasterAutomation: ${automation.address}`);

  // Save deployment addresses for frontend
  console.log("\nSaving deployment addresses...");
  const deploymentInfo = {
    btcUsdFeed: btcFeed,
    ethUsdFeed: ethFeed,
    betcaster: betcaster.address,
    betcasterAutomation: automation.address,
    chainId: process.env.NEXT_PUBLIC_CELO_CHAIN_ID,
    network: "celo-mainnet"
  };

  // Write deployment info to a file
  const fs = require("fs");
  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nVerification commands:");
  console.log("==================");
  console.log(`npx hardhat verify --network celo ${betcaster.address} ["BTC","ETH"] ["${btcFeed}","${ethFeed}"]`);
  console.log(`npx hardhat verify --network celo ${automation.address} ${betcaster.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 