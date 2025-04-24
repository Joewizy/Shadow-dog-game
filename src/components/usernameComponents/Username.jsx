import React, { useState } from "react";
import "./UsernameStyles.css";

const Username = ({ onUsernameSet }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onUsernameSet(trimmed);
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