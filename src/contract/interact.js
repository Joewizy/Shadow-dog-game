// interact.js
const ethers = require("ethers");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

monadChainId = 10143;
dotenv.config({ path: path.resolve(__dirname, '.deployments') });

// --- CONFIGURATION ---
const FORWARDER_ADDRESS = process.env.FORWARDER_ADDRESS;
const GREETINGS_ADDRESS = process.env.GREETINGS_ADDRESS;
const NEW_GREETING = "Hello Monad & Ethers!";
const RPC_URL = "https://testnet-rpc.monad.xyz"; 

const RELAYER_PRIVATE_KEY = process.env.RELAYER_KEY;
const USER_PRIVATE_KEY = process.env.HACKED_WALLET;

// --- ABI Loading ---
function getAbi(contractName) { 
    try {
        const contractJsonPath = path.resolve(__dirname, `out/${contractName}.sol/${contractName}.json`);
        const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
        return contractJson.abi;
    } catch (error) { console.error(`Error loading ABI for ${contractName}:`, error); process.exit(1); }
}

const forwarderAbi = getAbi("MinimalForwarder");
const greetingsAbi = getAbi("Greetings");

// --- EIP712 Definitions (same as before) ---
const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
];
const ForwardRequest = [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' }
];

// --- Helper Functions (adapted for standard Ethers) ---
async function buildRequest(forwarderContract, input) {
    const nonce = await forwarderContract.getNonce(input.from);
    const gas = 100000n; // Estimate appropriately in production
    return { value: 0n, gas, nonce, ...input };
}

async function buildTypedData(forwarderContract, request) {
    const chainId = (await forwarderContract.runner.provider.getNetwork()).chainId;
    const domain = {
        name: 'MinimalForwarder', // Match contract values
        version: '0.0.1',       // Match contract values
        chainId: chainId,
        verifyingContract: await forwarderContract.getAddress()
    };
    // For ethers v6, structure is slightly different
    return {
        domain,
        types: { ForwardRequest },
        primaryType: 'ForwardRequest', // Explicitly state primary type
        message: request
    };
}

async function signMetaTxRequest(signer, forwarderContract, input) {
    const request = await buildRequest(forwarderContract, input);
    const toSign = await buildTypedData(forwarderContract, request);
    // Use signer._signTypedData for ethers v5, or signer.signTypedData for v6+
    const signature = await signer.signTypedData(toSign.domain, toSign.types, toSign.message);
    return { signature, request };
}


// --- Main Interaction Logic ---
async function main() {
    if (!FORWARDER_ADDRESS || !GREETINGS_ADDRESS) {
        console.error("Deployment addresses not found. Make sure '.deployments' file exists and is populated.");
        process.exit(1);
    }
    console.log("Using Forwarder:", FORWARDER_ADDRESS);
    console.log("Using Greetings:", GREETINGS_ADDRESS);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const user = new ethers.Wallet(USER_PRIVATE_KEY, provider);

    console.log("Relayer Address:", relayer.address);
    console.log("User Address (Signer):", user.address);
    // You may want to check the relayer's MON balance
    const relayerBalance = await provider.getBalance(relayer.address);
    console.log(`Relayer MON balance: ${ethers.formatEther(relayerBalance)} MON`);
    if (relayerBalance < ethers.parseEther("0.1")) {
        console.warn("Warning: Relayer has low MON balance");
    }

    // Get contract instances
    const forwarderContract = new ethers.Contract(FORWARDER_ADDRESS, forwarderAbi, provider);
    const greetingsContract = new ethers.Contract(GREETINGS_ADDRESS, greetingsAbi, provider);

    console.log(`Initial greeting: ${await greetingsContract.greeting()}`);

    // 1. Encode the call data
    const greetingsInterface = new ethers.Interface(greetingsAbi);
    const data = greetingsInterface.encodeFunctionData("setGreeting", [NEW_GREETING]);

    // 2. User prepares and signs the meta-transaction request
    console.log(`User (${user.address}) signing the meta-transaction...`);
    const { signature, request } = await signMetaTxRequest(user, forwarderContract, {
        from: user.address,
        to: GREETINGS_ADDRESS,
        value: 0n,
        data: data
    });

    console.log("Signed Request:", request);
    console.log("Signature:", signature);

    // 3. Relayer verifies (optional)
    // Note: Connect the forwarder contract to the provider for read-only calls like verify
    const valid = await forwarderContract.verify(request, signature);
    if (!valid) {
        throw new Error("Signature verification failed!");
    }
    console.log("Signature verified successfully.");

    // 4. Relayer submits the transaction
    console.log(`Relayer (${relayer.address}) submitting via Forwarder.execute()...`);
    // Connect the forwarder contract to the relayer signer to send the transaction
    const tx = await forwarderContract.connect(relayer).execute(request, signature);
    const receipt = await tx.wait(); // Wait for transaction confirmation
    console.log("Transaction executed, hash:", receipt.hash);
    // console.log("Receipt:", receipt); // For more details if needed

    // 5. Verify the state change
    console.log(`New greeting: ${await greetingsContract.greeting()}`);

    await provider.getBalance(relayer.address);
    console.log(`Relayer MON balance: ${ethers.formatEther(relayerBalance)} MON`);

    // 6. Check emitted event (using receipt)
    const eventTopic = greetingsInterface.getEvent("GreetingUpdated").topicHash;
    let eventFound = false;
    for (const log of receipt.logs) {
         // Check address and topic[0]
         if (log.address.toLowerCase() === GREETINGS_ADDRESS.toLowerCase() && log.topics[0] === eventTopic) {
             const decodedEvent = greetingsInterface.parseLog(log);
             console.log("\nGreetingUpdated event found:");
             console.log("  Sender (from event):", decodedEvent.args.sender);
             console.log("  New Greeting (from event):", decodedEvent.args.newGreeting);
             if (decodedEvent.args.sender.toLowerCase() === user.address.toLowerCase()) {
                 console.log("SUCCESS: Event sender matches the original user!");
             } else {
                 console.log("ERROR: Event sender does NOT match the original user!");
             }
             eventFound = true;
             break; // Assuming only one event per tx for simplicity
         }
    }
    if (!eventFound) {
        console.log("GreetingUpdated event not found in transaction receipt.");
    }
}

main().catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
