import React, { useState } from "react";
import "./UsernameStyles.css";
import { ethers } from "ethers";
import toast from 'react-hot-toast';
import Web3 from "../../contract/web3";

const Username = ({ onUsernameSet }) => {
  const { isInitialize } = Web3();
  const [input, setInput] = useState("");
  const MONAD_TESTNET_CHAIN_ID = 10143; 
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
  
    try {
      const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const decChainId = Number(hexChainId);
      console.log("Chain ID:", decChainId);
  
      if (decChainId !== MONAD_TESTNET_CHAIN_ID) {
        toast.warning(
          `⚡ You’re on chain ${decChainId}, expected Monad Testnet (${MONAD_TESTNET_CHAIN_ID}). Continuing anyway…`
        );
      }
  
      onUsernameSet(trimmed);
    } catch (err) {
      toast.error("Error checking network. Make sure MetaMask is installed.");
      console.error(err);
    }
  };
    

  return (
    <div className="username-container">
      <h2>Choose Your Username</h2>
      <p className="username-subtitle">Username can only be set once!</p>
      <form onSubmit={handleSubmit} className="username-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter your username"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            minLength="3"
            maxLength="15"
            required
          />
        </div>
        <button type="submit" className="submit-button">Start Your Journey</button>
      </form>
    </div>
  );
};

export default Username;