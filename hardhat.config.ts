const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ignition");
require("@nomiclabs/hardhat-ethers");
require("dotenv/config");

console.log('Hardhat config - RPC_URL:', process.env.NEXT_PUBLIC_CELO_RPC_1);
console.log('Hardhat config - PRIVATE_KEY:', process.env.PRIVATE_KEY);

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
    celo: {
      url: process.env.NEXT_PUBLIC_CELO_RPC_1 || "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // monad: {
    //   url: "https://testnet-rpc.monad.xyz/",
    //   chainId: 10143,
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  // sourcify: {
  //   enabled: true,
  //   apiUrl: "https://sourcify.dev/server",
  //   browserUrl: "https://celoscan.io",
  //   contracts: {
  //     artifacts: "./artifacts",
  //     sources: "./contracts",
  //     imports: ["@chainlink/contracts", "@openzeppelin/contracts"],
  //     metadata: true,
  //     compilerSettings: {
  //       optimizer: {
  //         enabled: true,
  //         runs: 200
  //       }
  //     }
  //   }
  // },
  etherscan: {
    apiKey: {
      celo: process.env.CELOSCAN_API_KEY
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io"
        }
      }
    ]
  }
};

module.exports = config; 