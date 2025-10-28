/**
 * Wallet error types and error handling utilities
 */

// Custom error classes for different wallet scenarios
export class WalletNotInstalledError extends Error {
  constructor(message = 'Petra wallet is not installed. Please install it from the Chrome Web Store.') {
    super(message);
    this.name = 'WalletNotInstalledError';
  }
}

export class ConnectionRejectedError extends Error {
  constructor(message = 'Wallet connection was rejected. Please try again.') {
    super(message);
    this.name = 'ConnectionRejectedError';
  }
}

export class NetworkUnsupportedError extends Error {
  constructor(message = 'Please switch to a supported network in your Petra wallet.') {
    super(message);
    this.name = 'NetworkUnsupportedError';
  }
}

export class WalletLockedError extends Error {
  constructor(message = 'Please unlock your Petra wallet and try again.') {
    super(message);
    this.name = 'WalletLockedError';
  }
}

export class UnknownWalletError extends Error {
  constructor(message = 'An unexpected error occurred. Please try again.') {
    super(message);
    this.name = 'UnknownWalletError';
  }
}

// Error message constants
export const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: 'Petra wallet is not installed. Please install it from the Chrome Web Store.',
  CONNECTION_REJECTED: 'Wallet connection was rejected. Please try again.',
  NETWORK_UNSUPPORTED: 'Please switch to a supported network in your Petra wallet.',
  WALLET_LOCKED: 'Please unlock your Petra wallet and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;

// Error type union
export type WalletError = 
  | WalletNotInstalledError 
  | ConnectionRejectedError 
  | NetworkUnsupportedError 
  | WalletLockedError 
  | UnknownWalletError;

// Error handling utility function
export function handleWalletError(error: unknown): string {
  if (error instanceof WalletNotInstalledError) {
    return ERROR_MESSAGES.WALLET_NOT_INSTALLED;
  }
  
  if (error instanceof ConnectionRejectedError) {
    return ERROR_MESSAGES.CONNECTION_REJECTED;
  }
  
  if (error instanceof NetworkUnsupportedError) {
    return ERROR_MESSAGES.NETWORK_UNSUPPORTED;
  }
  
  if (error instanceof WalletLockedError) {
    return ERROR_MESSAGES.WALLET_LOCKED;
  }
  
  if (error instanceof Error) {
    // Check for common error messages from Petra wallet
    const message = error.message.toLowerCase();
    
    if (message.includes('user rejected') || message.includes('rejected')) {
      return ERROR_MESSAGES.CONNECTION_REJECTED;
    }
    
    if (message.includes('not installed') || message.includes('not found')) {
      return ERROR_MESSAGES.WALLET_NOT_INSTALLED;
    }
    
    if (message.includes('locked')) {
      return ERROR_MESSAGES.WALLET_LOCKED;
    }
    
    if (message.includes('network') || message.includes('chain')) {
      return ERROR_MESSAGES.NETWORK_UNSUPPORTED;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}