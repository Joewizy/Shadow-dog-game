import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { ethers } from "ethers";
import { forwarderAbi, forwarderContractAdress } from "../src/contract/abi.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Derive __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct absolute path to .env.local in the root folder (parent of server)
const envPath = join(__dirname, '..', '.env.local');

// Debugging: Verify if .env.local exists
if (fs.existsSync(envPath)) {
  console.log(`✔️ .env.local found at: ${envPath}`);
} else {
  console.error(`❌ .env.local not found at: ${envPath}`);
  console.log('Ensure .env.local is in the project root (e.g., /Users/mac/game-ui/) and is readable.');
}

// Load environment variables with error handling
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env.local:', result.error.message);
  console.log('Possible causes:');
  console.log('- File is missing or path is incorrect.');
  console.log('- File permissions prevent reading.');
  console.log('- Syntax error in .env.local (e.g., invalid format).');
  process.exit(1);
} else {
  console.log('✔️ Successfully loaded .env.local');
}

// Debugging: Log environment variables to verify
console.log('Environment Variables:');
console.log('RELAYER_PRIVATE_KEY:', process.env.RELAYER_PRIVATE_KEY ? '[set]' : 'undefined');
console.log('REACT_APP_RELAYER_ADDRESS:', process.env.REACT_APP_RELAYER_ADDRESS || 'undefined');
console.log('RPC_URL:', process.env.RPC_URL || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://japadog.netlify.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/api/debug/relayer", (req, res) => {
  try {
    const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY); 
    res.json({
      address: relayer.address,
      expected: process.env.REACT_APP_RELAYER_ADDRESS,
      match: relayer.address === process.env.REACT_APP_RELAYER_ADDRESS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/relay", async (req, res) => {
  const { signature, request } = req.body;

  if (!signature || !request) {
    return res.status(400).json({ error: "Missing signature or request" });
  }

  try {
    const fixedRequest = {
      ...request,
      value: BigInt(request.value),
      gas: BigInt(request.gas),
      nonce: BigInt(request.nonce),
    };

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

    const forwarder = new ethers.Contract(forwarderContractAdress, forwarderAbi, relayer);

    const valid = await forwarder.verify(fixedRequest, signature);
    if (!valid) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const tx = await forwarder.execute(fixedRequest, signature);
    const receipt = await tx.wait();

    return res.status(200).json({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      success: true,
    });
  } catch (err) {
    console.error("Relay error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Relayer listening on http://localhost:${PORT}`);
});