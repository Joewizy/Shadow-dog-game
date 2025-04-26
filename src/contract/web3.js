import { BrowserProvider, Contract, Interface, Wallet } from "ethers";
import { useEffect, useState } from "react";
import { gameAbi, gameContractAddress, forwarderAbi, forwarderContractAdress } from "./abi.js";
import { usePrivy } from "@privy-io/react-auth";
import toast from 'react-hot-toast';

// EIP712 Domain and Types
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

const Web3 = () => {
  const { authenticated, ready, user } = usePrivy();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [forwarderContract, setForwarderContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [isInitialize, setisInitialized] = useState(false);

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (ready && authenticated && user?.wallet) {
        try {
          const web3Provider = new BrowserProvider(window.ethereum); 
          const web3Signer = await web3Provider.getSigner();
          const address = await web3Signer.getAddress();

          const gameContract = new Contract(gameContractAddress, gameAbi, web3Signer);
          const forwarder = new Contract(forwarderContractAdress, forwarderAbi, web3Signer);
          const username = await gameContract.username(address);

          setProvider(web3Provider);
          setSigner(web3Signer);
          setContract(gameContract);
          setForwarderContract(forwarder);
          setUserAddress(address);
          setisInitialized(true);
        } catch (error) {
          console.error("Error initializing Web3:", error);
        }
      } else {
        setProvider(null);
        setSigner(null);
        setContract(null);
        setForwarderContract(null);
        setUserAddress("");
      }
    };

    initializeWeb3();
  }, [authenticated, user]);

  // Helper functions for meta transactions
  const buildRequest = async (from, to, data, gas = 200000n) => {
    if (!forwarderContract) return null;
    
    try {
      const nonce = await forwarderContract.getNonce(from);
      
      return {
        from,
        to,
        value: 0n,
        gas,
        nonce,
        data
      };
    } catch (error) {
      console.error("Error building request:", error);
      return null;
    }
  };

  const buildTypedData = async (request) => {
    if (!forwarderContract || !provider) return null;
    
    try {
      const chainId = (await provider.getNetwork()).chainId;
      const forwarderAddress = await forwarderContract.getAddress();
      
      return {
        domain: {
          name: 'MinimalForwarder',
          version: '0.0.1',
          chainId: chainId,
          verifyingContract: forwarderAddress
        },
        types: { 
          ForwardRequest 
        },
        primaryType: 'ForwardRequest',
        message: request
      };
    } catch (error) {
      console.error("Error building typed data:", error);
      return null;
    }
  };

  const signMetaTxRequest = async (request) => {
    if (!signer) return null;
    
    try {
      const typedData = await buildTypedData(request);
      if (!typedData) return null;
      
      const signature = await signer.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      );
      
      return { signature, request };
    } catch (error) {
      console.error("Error signing request:", error);
      return null;
    }
  };

  const sendMetaTx = async (signature, request) => {
    try {
      // Prepare request for JSON serialization
      const requestWithBigIntAsString = JSON.parse(
        JSON.stringify(request, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
      
      // Get API endpoint from environment or use default
      const relayerEndpoint = process.env.REACT_APP_RELAYER_ENDPOINT || 'http://localhost:4000/api/relay';

      console.log("Sending to relayer:", {
        signature,
        request: requestWithBigIntAsString
      });
      
      // Send to relayer service
      const response = await fetch(relayerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          request: requestWithBigIntAsString,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Relayer error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Relayer response:", data);
      
      if (data.error) {
        throw new Error(`Relayer execution failed: ${data.error}`);
      }
      
      return data.txHash;
    } catch (error) {
      console.error("Error sending meta-transaction:", error);
      return null;
    }
  };

  // Gasless transaction versions of your functions
  const createUsernameGasless = async (name) => {
    if (!contract || !userAddress) {
      console.error("Contract or user address not available");
      return false;
    }
    
    try {
      console.log(`Starting createUsernameGasless for ${name}...`);
      console.log("User address sending :", userAddress);
      
      // 1. Encode the function callx
      const gameInterface = new Interface(gameAbi);
      const data = gameInterface.encodeFunctionData("setPlayerName", [name]);
      console.log("Function data encoded");
      
      // 2. Build the request
      console.log("Building request...");
      const request = await buildRequest(
        userAddress,
        gameContractAddress,
        data
      );
      
      if (!request) {
        console.error("Failed to build request");
        return false;
      }
      console.log("Request built:", request);
      
      // 3. Sign the request
      console.log("Signing request...");
      const { signature, request: signedRequest } = await signMetaTxRequest(request);
      
      if (!signature) {
        console.error("Failed to sign request");
        return false;
      }
      console.log("Request signed:", { signature });
      
      // 4. Optional: Verify the signature client-side (with retry)
      try {
        console.log("Verifying signature...");
        const valid = await forwarderContract.verify(signedRequest, signature);
        if (!valid) {
          console.warn("⚠️ Signature verification failed");
          // Continue anyway as the relayer will verify again
        } else {
          console.log("✅ Signature verified successfully");
        }
      } catch (verifyError) {
        console.warn("⚠️ Signature verification error:", verifyError);
        // Continue anyway as the relayer will verify
      }
      
      // 5. Send the meta-tx via relayer
      console.log("Sending to relayer...");
      const txHash = await sendMetaTx(signature, signedRequest);
      
      if (txHash) {
        console.log("✅ Username set via meta-transaction:", txHash);
        toast.success("Username successfully registered")
        return true;
      }
      
      console.error("No transaction hash returned from relayer");
      return false;
    } catch (error) {
      console.error("Error setting username via meta-transaction:", error);
      return false;
    }
  };

  const updateScoreGasless = async (score) => {
    if (!contract || !userAddress) return false;
    
    try {
      console.log(`Starting updateScoreGasless for score ${score}...`);
      
      // 1. Encode the function call
      const gameInterface = new Interface(gameAbi);
      const data = gameInterface.encodeFunctionData("submitScore", [score]);
      
      // 2. Build the request
      console.log("Building request...");
      const request = await buildRequest(
        userAddress,
        gameContractAddress,
        data
      );
      
      if (!request) {
        console.error("Failed to build request");
        return false;
      }
      
      // 3. Sign the request
      console.log("Signing request...");
      const { signature, request: signedRequest } = await signMetaTxRequest(request);
      
      if (!signature) {
        console.error("Failed to sign request");
        return false;
      }
      
      // 4. Send the meta-tx via relayer
      console.log("Sending to relayer...");
      const txHash = await sendMetaTx(signature, signedRequest);
      
      if (txHash) {
        console.log("✅ Score updated via meta-transaction:", txHash);
        toast.success("Score successfully updated on chain")
        return true;
      }
      
      console.error("No transaction hash returned from relayer");
      return false;
    } catch (error) {
      console.error("Error updating score via meta-transaction:", error);
      return false;
    }
  };

  // Original functions
  const createUsername = async (name) => {
    if (!user || !contract) return;
    try {
      const tx = await contract.setPlayerName(name);
      const receipt = await tx.wait();
      console.log("✅ Username set:", receipt);
      return true;
    } catch (error) {
      console.error("Error setting username:", error);
      return false;
    }
  };

  const updateScore = async (score) => {
    if (!contract) return;
    try {
      const tx = await contract.submitScore(score);
      const receipt = await tx.wait();
      console.log("✅ Score updated:", receipt);
      return true;
    } catch (error) {
      console.error("Error updating score:", error);
      return false;
    }
  };

  const hasUsername = async (address) => {
    if (!contract || !address) {
        console.warn("contract or address not available"); 
        return false;
    }  
    try {
      const username = await contract.username(address);
      return username && username.length > 0 ? username : false;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  const getScore = async (address) => {
    if (!contract) return;
    try {
      return await contract.viewBestScore(address);
    } catch (error) {
      console.error("Error getting score:", error);
    }
  };

  const getLeaderboard = async (address) => {
    if (!contract || !address) return;
    try {
      return await contract.viewLeaderBoardScore(address);
    } catch (error) {
      console.error("Error getting leaderboard score:", error);
    }
  };

  const getAllLeaderboard = async () => {
    if (!contract) return;
    try {
      return await contract.viewPlayersLeaderBoard();
    } catch (error) {
      console.error("Couldn't fetch leaderboard:", error);
    }
  };

  return {
    provider,
    signer,
    contract,
    userAddress,
    createUsername,
    updateScore,
    getScore,
    getLeaderboard,
    getAllLeaderboard,
    hasUsername,
    createUsernameGasless,
    updateScoreGasless,
    isAuthenticated: authenticated,
    isInitialize,
  };
};

export default Web3;