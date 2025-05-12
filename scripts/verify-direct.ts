const hre = require("hardhat");

async function verifyDirect() {
  const betcasterAddress = "0x8AEA4985c1739d21968659bE091A2c7be6eA48a7";
  const symbols = ["BTC", "ETH"];
  const feeds = [
    "0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31",
    "0x0c76859E85727683Eeba0C70Bc2e0F5781337818"
  ];

  console.log("Verifying Betcaster contract...");
  try {
    await hre.run("verify:verify", {
      address: betcasterAddress,
      constructorArguments: [symbols, feeds],
    });
    console.log("✅ Betcaster contract verified successfully");
  } catch (error: any) {
    console.error("❌ Failed to verify Betcaster:", error.message);
  }
}

verifyDirect()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 