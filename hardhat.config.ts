const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ignition");
require("@nomiclabs/hardhat-ethers");
require("dotenv/config");

const config = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monad: {
      url: "https://testnet-rpc.monad.xyz/",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
    contracts: {
      artifacts: "./artifacts",
      sources: "./contracts",
      imports: ["@chainlink/contracts", "@openzeppelin/contracts"],
      metadata: true,
      compilerSettings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  etherscan: {
    enabled: false
  }
};

module.exports = config; 