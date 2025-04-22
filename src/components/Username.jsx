// UsernameForm.jsx
import { useState } from 'react';

export default function UsernameForm({ address, onSetUsername }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSetUsername(username);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  );
}