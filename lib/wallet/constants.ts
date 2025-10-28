/**
 * Wallet constants and configuration
 */

import { NetworkConfig } from './types';

// Supported Aptos networks
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Aptos Mainnet',
    chainId: '1',
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    supported: true,
  },
  testnet: {
    name: 'Aptos Testnet',
    chainId: '2',
    rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    supported: true,
  },
  devnet: {
    name: 'Aptos Devnet',
    chainId: '3',
    rpcUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    supported: true,
  },
} as const;

// Default network (can be changed based on environment)
export const DEFAULT_NETWORK = 'testnet';

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: 'petra_wallet_connected',
  LAST_CONNECTED_ACCOUNT: 'petra_last_account',
  PREFERRED_NETWORK: 'petra_preferred_network',
  CONNECTION_TIMESTAMP: 'petra_connection_timestamp',
} as const;

// Wallet connection timeout (in milliseconds)
export const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Auto-reconnection settings
export const AUTO_RECONNECT_DELAY = 1000; // 1 second
export const MAX_RECONNECT_ATTEMPTS = 3;

// Address display settings
export const ADDRESS_DISPLAY = {
  PREFIX_LENGTH: 6,
  SUFFIX_LENGTH: 4,
  SEPARATOR: '...',
} as const;

// Petra wallet detection
export const PETRA_WALLET_NAME = 'Petra';
export const PETRA_DOWNLOAD_URL = 'https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci';

// Event names for wallet events
export const WALLET_EVENTS = {
  ACCOUNT_CHANGED: 'accountChanged',
  NETWORK_CHANGED: 'networkChanged',
  DISCONNECT: 'disconnect',
} as const;

// Utility function to format wallet address
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  
  if (address.length <= ADDRESS_DISPLAY.PREFIX_LENGTH + ADDRESS_DISPLAY.SUFFIX_LENGTH) {
    return address;
  }
  
  const prefix = address.slice(0, ADDRESS_DISPLAY.PREFIX_LENGTH);
  const suffix = address.slice(-ADDRESS_DISPLAY.SUFFIX_LENGTH);
  
  return `${prefix}${ADDRESS_DISPLAY.SEPARATOR}${suffix}`;
}

// Utility function to validate Aptos address
export function isValidAptosAddress(address: string): boolean {
  // Basic validation for Aptos address format
  const aptosAddressRegex = /^0x[a-fA-F0-9]{1,64}$/;
  return aptosAddressRegex.test(address);
}

// Utility function to get network by chain ID
export function getNetworkByChainId(chainId: string): NetworkConfig | null {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId) || null;
}

// Utility function to check if network is supported
export function isNetworkSupported(chainId: string): boolean {
  return Object.values(SUPPORTED_NETWORKS).some(network => network.chainId === chainId && network.supported);
}