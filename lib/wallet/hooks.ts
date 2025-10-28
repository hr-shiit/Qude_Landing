'use client';

/**
 * Wallet hooks - Custom React hooks for wallet functionality
 */

import { useMemo, useCallback } from 'react';
import { useWalletContext } from './wallet-context';
import { 
  formatWalletAddress, 
  isValidAptosAddress,
  getNetworkByChainId,
  SUPPORTED_NETWORKS 
} from './index';

// Extended wallet state interface for hooks
export interface WalletHookState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  network: string | null;
  error: string | null;
  
  // Computed properties
  formattedAddress: string;
  isValidAddress: boolean;
  networkInfo: {
    name: string;
    chainId: string;
    isSupported: boolean;
  } | null;
  
  // Helper functions
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  
  // Utility functions
  copyAddress: () => Promise<boolean>;
  getAddressUrl: (explorer?: string) => string | null;
}

/**
 * Main wallet hook - provides complete wallet state and functionality
 */
export function useWallet(): WalletHookState {
  const context = useWalletContext();

  // Computed properties
  const formattedAddress = useMemo(() => {
    return context.account ? formatWalletAddress(context.account) : '';
  }, [context.account]);

  const isValidAddress = useMemo(() => {
    return context.account ? isValidAptosAddress(context.account) : false;
  }, [context.account]);

  const networkInfo = useMemo(() => {
    if (!context.network) return null;

    // Try to find network by name first
    const networkByName = Object.values(SUPPORTED_NETWORKS).find(
      n => n.name.toLowerCase() === context.network?.toLowerCase()
    );

    if (networkByName) {
      return {
        name: networkByName.name,
        chainId: networkByName.chainId,
        isSupported: networkByName.supported,
      };
    }

    // Try to find by chain ID
    const networkByChainId = getNetworkByChainId(context.network);
    if (networkByChainId) {
      return {
        name: networkByChainId.name,
        chainId: networkByChainId.chainId,
        isSupported: networkByChainId.supported,
      };
    }

    // Unknown network
    return {
      name: context.network,
      chainId: 'unknown',
      isSupported: false,
    };
  }, [context.network]);

  // Copy address to clipboard
  const copyAddress = useCallback(async (): Promise<boolean> => {
    if (!context.account) return false;

    try {
      await navigator.clipboard.writeText(context.account);
      return true;
    } catch (error) {
      console.error('Failed to copy address:', error);
      return false;
    }
  }, [context.account]);

  // Get explorer URL for address
  const getAddressUrl = useCallback((explorer = 'aptoscan'): string | null => {
    if (!context.account || !networkInfo) return null;

    const baseUrls: Record<string, Record<string, string>> = {
      aptoscan: {
        mainnet: 'https://aptoscan.com/account',
        testnet: 'https://testnet.aptoscan.com/account',
        devnet: 'https://devnet.aptoscan.com/account',
      },
      aptos: {
        mainnet: 'https://explorer.aptoslabs.com/account',
        testnet: 'https://explorer.aptoslabs.com/account?network=testnet',
        devnet: 'https://explorer.aptoslabs.com/account?network=devnet',
      },
    };

    const explorerUrls = baseUrls[explorer];
    if (!explorerUrls) return null;

    const networkKey = networkInfo.name.toLowerCase().replace(' ', '').replace('aptos', '');
    const baseUrl = explorerUrls[networkKey];
    
    return baseUrl ? `${baseUrl}/${context.account}` : null;
  }, [context.account, networkInfo]);

  return {
    // Basic state
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    account: context.account,
    network: context.network,
    error: context.error,
    
    // Computed properties
    formattedAddress,
    isValidAddress,
    networkInfo,
    
    // Actions
    connect: context.connect,
    disconnect: context.disconnect,
    clearError: context.clearError,
    
    // Utilities
    copyAddress,
    getAddressUrl,
  };
}

/**
 * Hook for wallet connection status only
 */
export function useWalletConnection() {
  const { isConnected, isConnecting, connect, disconnect, error, clearError } = useWallet();

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
    clearError,
  };
}

/**
 * Hook for wallet account information
 */
export function useWalletAccount() {
  const { 
    account, 
    formattedAddress, 
    isValidAddress, 
    copyAddress, 
    getAddressUrl 
  } = useWallet();

  return {
    account,
    formattedAddress,
    isValidAddress,
    copyAddress,
    getAddressUrl,
  };
}

/**
 * Hook for wallet network information
 */
export function useWalletNetwork() {
  const { network, networkInfo } = useWallet();

  const isMainnet = useMemo(() => {
    return networkInfo?.name.toLowerCase().includes('mainnet') || false;
  }, [networkInfo]);

  const isTestnet = useMemo(() => {
    return networkInfo?.name.toLowerCase().includes('testnet') || false;
  }, [networkInfo]);

  const isDevnet = useMemo(() => {
    return networkInfo?.name.toLowerCase().includes('devnet') || false;
  }, [networkInfo]);

  return {
    network,
    networkInfo,
    isMainnet,
    isTestnet,
    isDevnet,
    isSupported: networkInfo?.isSupported || false,
  };
}

/**
 * Hook for wallet error handling
 */
export function useWalletError() {
  const { error, clearError } = useWallet();

  const hasError = useMemo(() => Boolean(error), [error]);

  return {
    error,
    hasError,
    clearError,
  };
}

/**
 * Hook that returns true when wallet is ready for transactions
 */
export function useWalletReady() {
  const { isConnected, isValidAddress, networkInfo } = useWallet();

  const isReady = useMemo(() => {
    return isConnected && 
           isValidAddress && 
           networkInfo?.isSupported === true;
  }, [isConnected, isValidAddress, networkInfo]);

  return {
    isReady,
    isConnected,
    isValidAddress,
    isNetworkSupported: networkInfo?.isSupported || false,
  };
}

/**
 * Hook for wallet utilities and helper functions
 */
export function useWalletUtils() {
  const { copyAddress, getAddressUrl, formattedAddress } = useWallet();

  // Format any address (not just the connected one)
  const formatAddress = useCallback((address: string) => {
    return formatWalletAddress(address);
  }, []);

  // Validate any address
  const validateAddress = useCallback((address: string) => {
    return isValidAptosAddress(address);
  }, []);

  // Get network info for any network
  const getNetworkInfo = useCallback((networkName: string) => {
    const network = Object.values(SUPPORTED_NETWORKS).find(
      n => n.name.toLowerCase() === networkName.toLowerCase()
    );
    return network || null;
  }, []);

  return {
    copyAddress,
    getAddressUrl,
    formattedAddress,
    formatAddress,
    validateAddress,
    getNetworkInfo,
  };
}