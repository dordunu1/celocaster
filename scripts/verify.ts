const { run } = require("hardhat");
const fs = require("fs");

async function verifyContracts() {
  console.log("Starting contract verification...");

  // Read deployment info
  const deploymentInfo = JSON.parse(
    fs.readFileSync("./deployments.json", "utf8")
  );

  const {
    btcUsdFeed,
    ethUsdFeed,
    celocaster,
    celocasterAutomation
  } = deploymentInfo;

  console.log("\nVerifying Celocaster contract...");
  try {
    await run("verify:verify", {
      address: celocaster,
      constructorArguments: [
        ["BTC", "ETH"],
        [btcUsdFeed, ethUsdFeed]
      ],
    });
    console.log("✅ Celocaster contract verified successfully");
  } catch (error: any) {
    console.error("❌ Failed to verify Celocaster:", error.message);
  }

  console.log("\nVerifying CelocasterAutomation contract...");
  try {
    await run("verify:verify", {
      address: celocasterAutomation,
      constructorArguments: [celocaster],
    });
    console.log("✅ CelocasterAutomation contract verified successfully");
  } catch (error: any) {
    console.error("❌ Failed to verify CelocasterAutomation:", error.message);
  }
}

verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 