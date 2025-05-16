require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABI
const betcasterArtifact = require('../artifacts/contracts/Betcaster.sol/Betcaster.json');
const abi = betcasterArtifact.abi;

// Load env variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BETCASTER_ADDRESS; // or set a specific env var

if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS) {
  console.error('Missing env vars: PRIVATE_KEY, RPC_URL, or CONTRACT_ADDRESS');
  process.exit(1);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  // Print wallet address and balance
  const walletAddress = await wallet.getAddress();
  const walletBalance = await provider.getBalance(walletAddress);
  console.log(`Wallet address: ${walletAddress}`);
  console.log(`Wallet balance: ${ethers.utils.formatEther(walletBalance)} CELO`);

  // Optional: Check contract balance before
  const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log(`Contract balance: ${ethers.utils.formatEther(contractBalance)} CELO`);

  // Call withdraw (with manual gas limit)
  const tx = await contract.withdraw({ gasLimit: 500000 });
  console.log('Withdraw transaction sent:', tx.hash);

  // Wait for confirmation
  await tx.wait();
  console.log('Withdraw confirmed!');

  // Optional: Check contract balance after
  const newBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log(`New contract balance: ${ethers.utils.formatEther(newBalance)} CELO`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
}); 