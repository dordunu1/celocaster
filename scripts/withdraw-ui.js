require('dotenv').config();
const { ethers } = require('ethers');
const readline = require('readline');
const celocasterArtifact = require('../artifacts/contracts/Celocaster.sol/Celocaster.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CONTRACT_ADDRESS = "0x5de50FF0A6Ac3B9f6F7beE2e72EcadAa3a718705";
const WITHDRAW_AMOUNT = ethers.utils.parseEther("9");

async function setupProvider() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_CELO_RPC_1);
  return provider;
}

async function setupWallet(provider) {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return wallet;
}

async function checkBalances(provider, wallet) {
  const walletAddress = await wallet.getAddress();
  const walletBalance = await provider.getBalance(walletAddress);
  const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);

  console.log('\n=== Current Balances ===');
  console.log(`Wallet (${walletAddress}): ${ethers.utils.formatEther(walletBalance)} CELO`);
  console.log(`Contract: ${ethers.utils.formatEther(contractBalance)} CELO`);
  console.log('======================\n');

  return { walletBalance, contractBalance };
}

async function confirmWithdrawal() {
  return new Promise((resolve) => {
    rl.question('Do you want to proceed with withdrawing 9 CELO? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function performWithdrawal(contract) {
  console.log('\nInitiating withdrawal...');
  const tx = await contract.withdraw({ gasLimit: 500000 });
  console.log('Transaction sent:', tx.hash);
  
  console.log('Waiting for confirmation...');
  const receipt = await tx.wait();
  
  console.log('\n=== Transaction Details ===');
  console.log(`Transaction Hash: ${receipt.transactionHash}`);
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  console.log('========================\n');
}

async function main() {
  try {
    console.log('=== CELO Withdrawal UI ===');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Withdrawal Amount: 9 CELO\n');

    const provider = await setupProvider();
    const wallet = await setupWallet(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, celocasterArtifact.abi, wallet);

    // Check balances
    const { contractBalance } = await checkBalances(provider, wallet);

    // Verify contract has enough balance
    if (contractBalance.lt(WITHDRAW_AMOUNT)) {
      throw new Error(`Contract doesn't have enough balance. Has: ${ethers.utils.formatEther(contractBalance)} CELO, Needs: 9 CELO`);
    }

    // Get user confirmation
    const shouldProceed = await confirmWithdrawal();
    if (!shouldProceed) {
      console.log('Withdrawal cancelled by user.');
      process.exit(0);
    }

    // Perform withdrawal
    await performWithdrawal(contract);

    // Check final balances
    await checkBalances(provider, wallet);

    console.log('Withdrawal completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\nError:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Insufficient funds for gas. Please ensure your wallet has enough CELO for gas fees.');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 