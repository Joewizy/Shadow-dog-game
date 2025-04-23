import React, { useState } from 'react';
import './TopBar.css'; 

const TopBar = ({ authenticated, user, login, logout }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const walletAddress = user?.wallet?.address;

  const shortenAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  const handleTopBarClick = () => {
    if (authenticated) {
      setIsDropdownVisible(!isDropdownVisible);
    } else {
      login();
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownVisible(false);
  };

  return (
    <div className="topbar-container">
      {/* Main TopBar Button */}
      <div
        onClick={handleTopBarClick}
        className="topbar-button"
        onMouseEnter={() => setIsDropdownVisible(true)}
        onMouseLeave={() => setIsDropdownVisible(false)}
      >
        {authenticated ? shortenAddress(walletAddress) : 'Connect Wallet'}
      </div>

      {/* Dropdown menu when authenticated */}
      {authenticated && (
        <div
          onClick={handleLogout}
          className={`topbar-dropdown ${isDropdownVisible ? 'visible' : ''}`}
        >
          Disconnect
        </div>
      )}
    </div>
  );
};

export default TopBar;
