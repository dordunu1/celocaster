async function main() {
  const hre = require("hardhat");
  await hre.run("verify:verify", {
    address: "0x5de50FF0A6Ac3B9f6F7beE2e72EcadAa3a718705",
    constructorArguments: [
      ["BTC", "ETH"],
      ["0x128fE88eaa22bFFb868Bb3A584A54C96eE24014b", "0x1FcD30A73D67639c1cD89ff5746E7585731c083B"]
    ]
  });
}
main(); 