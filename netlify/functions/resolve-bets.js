const { schedule } = require('@netlify/functions');
const { ethers } = require('ethers');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---

// Firestore setup
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}
const db = admin.firestore();

// Ethers setup
const PRIVATE_KEY = process.env.AUTOMATION_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL; // e.g., your testnet RPC endpoint
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI_PATH = path.join(__dirname, '../../artifacts/contracts/Betcaster.sol/Betcaster.json');
const CONTRACT_ABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// --- SCHEDULED FUNCTION ---
const handler = async (event, context) => {
  const now = Date.now();
  const betsRef = db.collection('bets');
  const snapshot = await betsRef
    .where('status', '==', 'ACTIVE')
    .where('expiryTime', '<=', now)
    .get();

  if (snapshot.empty) {
    return { statusCode: 200, body: 'No bets to resolve.' };
  }

  let resolved = 0;
  for (const doc of snapshot.docs) {
    const bet = doc.data();
    try {
      const tx = await contract.resolveBet(bet.id);
      await tx.wait();
      await betsRef.doc(bet.id).update({ status: 'RESOLVED' });
      resolved++;
    } catch (e) {
      // Ignore already resolved or failed
    }
  }

  return {
    statusCode: 200,
    body: `Resolved ${resolved} bets.`,
  };
};

exports.handler = schedule('@every 5m', handler); // Runs every 5 minutes 