require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_1;
  const contractAddress = "0x5de50FF0A6Ac3B9f6F7beE2e72EcadAa3a718705"; // Hardcoded old contract address
  const amountToSend = "2"; // 2 CELO

  if (!privateKey || !rpcUrl) {
    console.error('Missing environment variables: PRIVATE_KEY or NEXT_PUBLIC_CELO_RPC_1');
    process.exit(1);
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Sending ${amountToSend} CELO from ${wallet.address} to ${contractAddress}`);

    // Convert amount to wei
    const amountWei = ethers.utils.parseEther(amountToSend);

    // Create and send transaction
    const tx = await wallet.sendTransaction({
      to: contractAddress,
      value: amountWei,
      gasLimit: 210000 // Standard gas limit for simple transfers on Celo
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Check contract balance after sending
    const contractBalance = await provider.getBalance(contractAddress);
    console.log(`New contract balance: ${ethers.utils.formatEther(contractBalance)} CELO`);

  } catch (error) {
    console.error('Error sending CELO:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error('Insufficient funds in wallet to send transaction.');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 