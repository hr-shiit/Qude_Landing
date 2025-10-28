/**
 * Core wallet types and interfaces for Petra wallet integration
 */

// Wallet connection state
export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  network: string | null;
  error: string | null;
  lastConnected: number | null;
}

// Wallet context type for React Context
export interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  network: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Wallet adapter interface
export interface WalletAdapter {
  connect(): Promise<{
    address: string;
    publicKey: string;
    network: string;
  }>;
  
  disconnect(): Promise<void>;
  
  isConnected(): boolean;
  
  getAccount(): Promise<string | null>;
  
  getNetwork(): Promise<string>;
  
  onAccountChange(callback: (account: string) => void): void;
  
  onNetworkChange(callback: (network: string) => void): void;
}

// Connection result
export interface ConnectionResult {
  success: boolean;
  account?: string;
  network?: string;
  error?: string;
}

// Network configuration
export interface NetworkConfig {
  name: string;
  chainId: string;
  rpcUrl: string;
  supported: boolean;
}

// Component prop types
export interface WalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface WalletDisplayProps {
  showFullAddress?: boolean;
  showNetwork?: boolean;
  className?: string;
}

// Mock wallet adapter for testing
export interface MockWalletAdapter {
  mockConnect: (result: ConnectionResult) => void;
  mockDisconnect: () => void;
  mockNetworkChange: (network: string) => void;
  mockError: (error: string) => void;
}