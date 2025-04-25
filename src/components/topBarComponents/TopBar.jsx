import React, { useState, useRef, useEffect } from 'react';
import './TopBar.css';

const TopBar = ({ authenticated, user, login, logout }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const walletAddress = user?.wallet?.address;

  const shortenAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTopBarClick = () => {
    if (authenticated) {
      setIsDropdownVisible(!isDropdownVisible);
    } else {
      login();
    }
  };

  const handleLogout = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    logout();
    setIsDropdownVisible(false);
  };

  return (
    <div className="topbar-container">
      {/* Main TopBar Button */}
      <div
        ref={buttonRef}
        onClick={handleTopBarClick}
        className="topbar-button"
      >
        {authenticated ? shortenAddress(walletAddress) : 'Connect Wallet'}
      </div>

      {/* Dropdown menu when authenticated */}
      {authenticated && (
        <div
          ref={dropdownRef}
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