require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABI
const celocasterArtifact = require('../artifacts/contracts/Celocaster.sol/Celocaster.json');
const abi = celocasterArtifact.abi;

// Load env variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_1;
const CONTRACT_ADDRESS = "0x5de50FF0A6Ac3B9f6F7beE2e72EcadAa3a718705"; // Old contract address
const WITHDRAW_AMOUNT = ethers.utils.parseEther("9"); // 9 CELO

if (!PRIVATE_KEY || !RPC_URL) {
  console.error('Missing env vars: PRIVATE_KEY or RPC_URL');
  process.exit(1);
}

async function main() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    // Print wallet address and balance
    const walletAddress = await wallet.getAddress();
    const walletBalance = await provider.getBalance(walletAddress);
    console.log(`Wallet address: ${walletAddress}`);
    console.log(`Wallet balance: ${ethers.utils.formatEther(walletBalance)} CELO`);

    // Check contract balance
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log(`Contract balance: ${ethers.utils.formatEther(contractBalance)} CELO`);

    // Verify we have enough balance
    if (contractBalance.lt(WITHDRAW_AMOUNT)) {
      throw new Error(`Contract doesn't have enough balance. Has: ${ethers.utils.formatEther(contractBalance)} CELO, Needs: 9 CELO`);
    }

    // Call withdraw
    console.log('Initiating withdrawal of 9 CELO...');
    const tx = await contract.withdraw({ gasLimit: 500000 });
    console.log('Withdraw transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Withdraw confirmed!');
    console.log('Transaction details:', {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    // Check final contract balance
    const newBalance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log(`New contract balance: ${ethers.utils.formatEther(newBalance)} CELO`);

  } catch (error) {
    console.error('Error during withdrawal:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Insufficient funds for gas. Please ensure your wallet has enough CELO for gas fees.');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
}); 