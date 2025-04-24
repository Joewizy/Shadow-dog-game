import React, { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Award } from "lucide-react";
import "./GameLeaderboard.css";

// Mock data for the leaderboard
const mockLeaderboard = [
  {
    id: "1",
    username: "ShadowMaster",
    score: 9850,
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    rank: 1,
  },
  {
    id: "2",
    username: "CryptoNinja",
    score: 8720,
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    rank: 2,
  },
  {
    id: "3",
    username: "BlockchainWarrior",
    score: 7650,
    walletAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
    rank: 3,
  },
  {
    id: "4",
    username: "TokenHunter",
    score: 6540,
    walletAddress: "0xdef1234567890abcdef1234567890abcdef123456",
    rank: 4,
  },
  {
    id: "5",
    username: "Web3Legend",
    score: 5430,
    walletAddress: "0x567890abcdef1234567890abcdef1234567890abc",
    rank: 5,
  },
];

export function GameLeaderboard() {
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [isExpanded, setIsExpanded] = useState(false);

  // In a real app, you would fetch the leaderboard data here
  useEffect(() => {
    // Fetch leaderboard data
    // Example: fetchLeaderboard().then(data => setLeaderboard(data))
  }, []);

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="rank-icon gold" />;
      case 2:
        return <Medal className="rank-icon silver" />;
      case 3:
        return <Medal className="rank-icon bronze" />;
      default:
        return <Award className="rank-icon" />;
    }
  };

  const displayRows = isExpanded ? leaderboard : leaderboard.slice(0, 3);

  return (
    <div className="game-leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <Trophy className="leaderboard-icon" /> Top Players
        </h2>
      </div>
      
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-column">Rank</th>
              <th className="username-column">Username</th>
              <th className="score-column">Score</th>
              <th className="wallet-column">Wallet</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((entry) => (
              <tr key={entry.id} className={`leaderboard-row rank-${entry.rank}`}>
                <td className="rank-cell">
                  <div className="rank-icon-container">{getRankIcon(entry.rank)}</div>
                </td>
                <td className="username-cell">{entry.username}</td>
                <td className="score-cell">{entry.score.toLocaleString()}</td>
                <td className="wallet-cell">{truncateAddress(entry.walletAddress)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {leaderboard.length > 3 && (
        <button 
          className="view-more-button" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "View More"}
        </button>
      )}
    </div>
  );
}
