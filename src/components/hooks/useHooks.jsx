import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const MONAD_TESTNET_CHAIN_ID = 10143;

export const useNetwork = () => {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const correct = network.chainId === MONAD_TESTNET_CHAIN_ID;
      setIsCorrectNetwork(correct);
      
      if (!correct) {
        toast.error('Please switch to Monad Testnet!', {
          id: 'network-error',
          duration: Infinity
        });
      } else {
        toast.dismiss('network-error');
      }
      
      return correct;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => {
      checkNetwork();
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    checkNetwork();

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return { isCorrectNetwork, checkNetwork };
};