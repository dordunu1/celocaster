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
    betcaster,
    betcasterAutomation
  } = deploymentInfo;

  console.log("\nVerifying Betcaster contract...");
  try {
    await run("verify:verify", {
      address: betcaster,
      constructorArguments: [
        ["BTC", "ETH"],
        [btcUsdFeed, ethUsdFeed]
      ],
    });
    console.log("✅ Betcaster contract verified successfully");
  } catch (error: any) {
    console.error("❌ Failed to verify Betcaster:", error.message);
  }

  console.log("\nVerifying BetcasterAutomation contract...");
  try {
    await run("verify:verify", {
      address: betcasterAutomation,
      constructorArguments: [betcaster],
    });
    console.log("✅ BetcasterAutomation contract verified successfully");
  } catch (error: any) {
    console.error("❌ Failed to verify BetcasterAutomation:", error.message);
  }
}

verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 