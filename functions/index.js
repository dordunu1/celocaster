/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const { ethers } = require("ethers");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Firestore setup
if (!admin.apps.length) {
  admin.initializeApp(); // No need for credentials, handled by Firebase
}
const db = admin.firestore();

// Ethers setup (TEMPORARY for first deploy only!)
const PRIVATE_KEY = process.env.AUTOMATION_PRIVATE_KEY;
const RPC_URL = process.env.AUTOMATION_RPC_URL;
const CONTRACT_ADDRESS = process.env.AUTOMATION_CONTRACT_ADDRESS;
const ABI_PATH = path.join(__dirname, "Betcaster.json");
const CONTRACT_ABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

exports.resolveBets = onSchedule("every 1 minutes", async (event) => {
    const now = Date.now();
    const betsRef = db.collection("bets");
    const snapshot = await betsRef
      .where("status", "==", "ACTIVE")
      .where("expiryTime", "<=", now)
      .get();

    console.log("Now:", now);
    console.log("Querying for bets with status 'ACTIVE' and expiryTime <=", now);
    console.log("Found", snapshot.size, "bets");
    snapshot.docs.forEach(doc => {
      const bet = doc.data();
      console.log(`Bet ${bet.id}: expiryTime=${bet.expiryTime}, status=${bet.status}`);
    });

    if (snapshot.empty) {
      console.log("No bets to resolve.");
      return null;
    }

    let resolved = 0;
    for (const doc of snapshot.docs) {
      const bet = doc.data();
      try {
        const tx = await contract.resolveBet(bet.id);
        await tx.wait();
        // Fetch resolved bet info from contract
        const betInfo = await contract.getBetInfo(bet.id);
        // betInfo is a struct, destructure the relevant fields
        const thresholdMet = betInfo.thresholdMet;
        const endPrice = betInfo.endPrice;
        await betsRef.doc(bet.id).update({
          status: "RESOLVED",
          thresholdMet,
          endPrice: endPrice ? Number(ethers.utils.formatUnits(endPrice, 8)) : undefined // 8 decimals for Chainlink price feeds
        });
        resolved++;
      } catch (e) {
        console.error(`Failed to resolve bet ${bet.id}:`, e);
      }
    }

    console.log(`Resolved ${resolved} bets.`);
    return null;
  });