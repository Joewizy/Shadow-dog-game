import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import GameComponent from './components/gameComponents/GameComponent'; 
import Username from './components/usernameComponents/Username';
import TopBar from './components/topBarComponents/TopBar';
import Web3 from './contract/web3';
import { GameLeaderboard } from './components/leaderComponents/GameLeaderboard';
import './App.css';
import { Toaster } from 'react-hot-toast';


function App() {
  const { login, authenticated, ready, user, logout } = usePrivy();
  const { hasUsername, createUsernameGasless, isInitialize } = Web3();
  const walletAddress = user?.wallet?.address;

  const [username, setUsername] = useState('');
  const [readyToPlay, setReadyToPlay] = useState(false);

  const handleUsernameSet = async (newUsername) => {
    try {
      const success = await createUsernameGasless(newUsername);
      if (success) {
        setUsername(newUsername);
      } else {
        console.error("Error setting username on blockchain");
      }
    } catch (error) {
      console.error("Error setting username:", error);
    }
  };

  useEffect(() => {
    const checkUsername = async () => {
      if (walletAddress && isInitialize) {
        console.log('Checking username for address:', walletAddress);
        const usernameExists = await hasUsername(walletAddress);
        console.log('Username exists:', usernameExists);
        if (usernameExists) {
          const blockchainUsername = await hasUsername(walletAddress); 
          setUsername(blockchainUsername);
        }
      }
    };

    checkUsername(); 
  }, [walletAddress, isInitialize, hasUsername]);

  return (
    <div className="app">
      <Toaster position="top-right" /> 
      <TopBar authenticated={authenticated} user={user} login={login} logout={logout} />
      
      <main className="main-content">
        {ready && authenticated ? (
          <div className="game-wrapper">
            {!username ? (
              <Username onUsernameSet={handleUsernameSet} />
            ) : !readyToPlay ? (
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
            ) : (
              <GameComponent />
            )}
          </div>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Shadow Dog Game</h1>
              <p className="welcome-text">Connect your wallet to embark on an epic adventure</p>
              <button className="connect-button" onClick={login}>
                Connect Wallet to Play
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
