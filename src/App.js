import React from 'react';
import './App.css';
import { usePrivy } from '@privy-io/react-auth';
import GameComponent from '../src/components/gameComponents/GameComponent'; 
import Username from '../src/components/usernameComponents/Username';
import { useState, useEffect } from 'react';
import TopBar from './components/topBarComponents/TopBar';

function App() {
  const { login, authenticated, ready, user, logout } = usePrivy();
  const walletAddress = user?.wallet?.address;
  
  const [username, setUsername] = useState('');
  const [readyToPlay, setReadyToPlay] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      const savedUsername = localStorage.getItem(`username-${walletAddress}`);
      if (savedUsername) {
        setUsername(savedUsername);
      }
    }
  }, [walletAddress]);

  const handleUsernameSet = (newUsername) => {
    localStorage.setItem(`username-${walletAddress}`, newUsername);
    setUsername(newUsername);
  };

  return (
    <div className="app">
      <TopBar authenticated={authenticated} user={user} login={login} logout={logout} />
      
      <main className="main-content">
        {ready && authenticated ? (
          <div className="game-wrapper">
            {!username ? (
              <Username onUsernameSet={handleUsernameSet} />
            ) : !readyToPlay ? (
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