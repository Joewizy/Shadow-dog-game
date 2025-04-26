import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import GameComponent from './components/gameComponents/GameComponent'; 
import Username from './components/usernameComponents/Username';
import TopBar from './components/topBarComponents/TopBar';
import Web3 from './contract/web3';
import { GameLeaderboard } from './components/leaderComponents/GameLeaderboard';
import './App.css';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

function App() {
  const { login, authenticated, ready, user, logout } = usePrivy();
  const { hasUsername, createUsernameGasless, isInitialize } = Web3();
  const walletAddress = user?.wallet?.address;

  const MONAD_TESTNET_CHAIN_ID = 10143; 
  const [username, setUsername] = useState('');
  const [readyToPlay, setReadyToPlay] = useState(false);
  const [authStatus, setAuthStatus] = useState('initial'); // 'initial', 'connecting', 'wallet-needed', 'authenticated'

  const handleUsernameSet = async (newUsername) => {
    try {
      toast.loading("Setting username on blockchain...");
      const success = await createUsernameGasless(newUsername);
      if (success) {
        toast.dismiss();
        toast.success("Username successfully set!");
        setUsername(newUsername);
      } else {
        toast.dismiss();
        toast.error("Error setting username on blockchain");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error setting username: " + error.message);
      console.error("Error setting username:", error);
    }
  };

  const handleConnect = () => {
    setAuthStatus('connecting');
    login();
  };

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        const network = await provider.getNetwork();
        if (network.chainId !== MONAD_TESTNET_CHAIN_ID && isInitialize) {
          toast.error("Please switch your wallet to Monad Testnet!");
        }
      }
    };

    if (authStatus === 'authenticated') {
      checkNetwork();
    }
  }, [authStatus]);

  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      setAuthStatus('authenticated');
    } else if (ready && authenticated && !walletAddress) {
      setAuthStatus('wallet-needed');
    } else if (ready && !authenticated) {
      setAuthStatus('initial');
    }
  }, [ready, authenticated, walletAddress]);

  useEffect(() => {
    const checkUsername = async () => {
      if (walletAddress && isInitialize) {
        console.log('Checking username for address:', walletAddress);
        try {
          const usernameExists = await hasUsername(walletAddress);
          console.log('Username exists:', usernameExists);
          if (usernameExists) {
            const blockchainUsername = await hasUsername(walletAddress); 
            setUsername(blockchainUsername);
          }
        } catch (error) {
          console.error("Error checking username:", error);
          toast.error("Failed to fetch username from blockchain");
        }
      }
    };

    if (authStatus === 'authenticated') {
      checkUsername();
    }
  }, [walletAddress, isInitialize, hasUsername, authStatus]);

  // Render function for authentication state
  const renderAuthState = () => {
    if (authStatus === 'initial') {
      return (
        <div className="welcome-screen">
          <div className="welcome-content">
            <img src='assets/images/heropic.jpg' className='hero-image' alt="Shadow Dog hero" />
            <h1>Shadow Dog Game</h1>
            <p className="welcome-text">Connect your wallet to embark on an epic adventure</p>
            <button className="connect-button" onClick={handleConnect}>
              Connect Wallet to Play
            </button>
          </div>
        </div>
      );
    }
    
    if (authStatus === 'connecting') {
      return (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Connecting...</h2>
            <p>Please approve the connection request in your wallet</p>
          </div>
        </div>
      );
    }
    
    if (authStatus === 'wallet-needed') {
      return (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Wallet Selection Required</h2>
            <p className="welcome-text">Please select a wallet provider (MetaMask or Phantom) when prompted to continue.</p>
            <p className="welcome-text-small">This step is necessary to access your wallet address for the game.</p>
            <button className="connect-button" onClick={logout}>
              Cancel
            </button>
            <button className="connect-button" onClick={handleConnect}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    if (authStatus === 'authenticated') {
      if (!username) {
        return <Username onUsernameSet={handleUsernameSet} />;
      } else if (!readyToPlay) {
        return (
          <div className="welcome-container">
            <div className="pre-game">
              <h2>Welcome, <span className="username-highlight">{username}</span>!</h2>
              <p className="pre-game-text">Your adventure awaits. Are you ready to begin?</p>
              <button
                className="play-button"
                onClick={() => setReadyToPlay(true)}
              >
                PLAY NOW
              </button>
            </div>
            <div className="welcome-leaderboard-container">
              <GameLeaderboard />
            </div>
          </div>
        );
      } else {
        return <GameComponent />;
      }
    }
  };

  return (
    <div className="app">
      <Toaster position="top-left" /> 
      <TopBar 
        authenticated={authenticated} 
        user={user} 
        login={handleConnect} 
        logout={logout} 
        username={username}
      />

      <main className="main-content">
        {ready ? (
          <div className="game-wrapper">
            {renderAuthState()}
          </div>
        ) : (
          <div className="loading-screen">
            <p>Loading game...</p>
          </div>
        )}
      </main>
      <footer className="footer">
      <a href="https://twitter.com/BruceWayne82118" target="_blank" rel="noopener noreferrer">Joewizy🦇</a>
    </footer>
    </div>
  );
}

export default App;