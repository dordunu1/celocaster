async function main() {
  const hre = require("hardhat");
  await hre.run("verify:verify", {
    address: "0x73B18a087F27fD3601718ad49235887662FE71aD",
    constructorArguments: [
      ["BTC", "ETH", "CELO"],
      ["0x128fE88eaa22bFFb868Bb3A584A54C96eE24014b", "0x1FcD30A73D67639c1cD89ff5746E7585731c083B", "0x0568fD19986748cEfF3301e55c0eb1E729E0Ab7e"]
    ]
  });
}
main(); 