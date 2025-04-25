import React, { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Award } from "lucide-react";
import Web3 from "../../contract/web3";
import "./GameLeaderboard.css";

export function GameLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getAllLeaderboard, hasUsername, isInitialize } = Web3();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!isInitialize) {
        console.log("Web3 not initialized yet");
        return;
      }

      try {
        console.log("Fetching on-chain leaderboard...");
        const onChainLeaderboard = await getAllLeaderboard();
        console.log("Raw leaderboard from contract:", onChainLeaderboard);

        const players = onChainLeaderboard[0]; 
        const scores = onChainLeaderboard[1];  

        if (players.length !== scores.length) {
          console.error("Mismatch between players and scores arrays");
          return;
        }

        // Combine the arrays into a structured format
        const structured = players.map((player, index) => ({
          player,
          score: scores[index],
        }));

        // Enrich the leaderboard with usernames and additional metadata
        const enrichedLeaderboard = await Promise.all(
          structured.map(async (entry, index) => {
            const username = await hasUsername(entry.player);
            console.log(`User ${entry.player} has username:`, username);
            return {
              id: index.toString(),
              username: username || "Anonymous",
              score: Number(entry.score), 
              walletAddress: entry.player,
              rank: index + 1,
            };
          })
        );

        // Filter out any invalid entries
        const filteredLeaderboard = enrichedLeaderboard.filter(Boolean);
        filteredLeaderboard.sort((a, b) => b.score - a.score);
        filteredLeaderboard.forEach((entry, i) => (entry.rank = i + 1));

        console.log("Final leaderboard:", filteredLeaderboard);
        setLeaderboard(filteredLeaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboardData();
  }, [isInitialize]);

  const truncateAddress = (address) => {
    if (!address || typeof address !== "string") return "N/A";
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