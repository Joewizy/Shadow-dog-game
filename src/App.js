import logo from './logo.svg';
import './App.css';
import { usePrivy } from '@privy-io/react-auth';
import GameComponent from './components/GameComponent';

function App() {
  const { login, authenticated, ready, user } = usePrivy();

  return (
    <div className="App">
      {/* {ready && authenticated ? (
        <GameComponent />
      ) : ( */}
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Welcome to the Shadow Dog Game</p>
          <p>User Wallet address is: {user?.wallet?.address}</p>
          <button onClick={login} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Connect Wallet to Play
          </button>
        </header>
      {/* )} */}
    </div>
  );
}

export default App;