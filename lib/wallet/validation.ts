/**
 * Wallet validation utilities and enhanced error handling
 */

import { 
  NetworkUnsupportedError,
  UnknownWalletError,
  SUPPORTED_NETWORKS,
  isValidAptosAddress,
  getNetworkByChainId
} from './index';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Connection data validation
export interface ConnectionData {
  address?: string;
  publicKey?: string;
  network?: string;
}

/**
 * Validate wallet connection data
 */
export function validateConnectionData(data: ConnectionData): ValidationResult {
  // Check if address is provided and valid
  if (!data.address) {
    return {
      isValid: false,
      error: 'Wallet address is required'
    };
  }

  if (!isValidAptosAddress(data.address)) {
    return {
      isValid: false,
      error: 'Invalid Aptos wallet address format'
    };
  }

  // Check if public key is provided
  if (!data.publicKey) {
    return {
      isValid: false,
      error: 'Public key is required'
    };
  }

  // Validate public key format (basic check)
  if (!isValidPublicKey(data.publicKey)) {
    return {
      isValid: false,
      error: 'Invalid public key format'
    };
  }

  // Check network if provided
  if (data.network && !isValidNetwork(data.network)) {
    return {
      isValid: false,
      error: 'Unsupported network'
    };
  }

  return { isValid: true };
}

/**
 * Validate public key format
 */
export function isValidPublicKey(publicKey: string): boolean {
  // Basic validation for Aptos public key (64 hex characters with optional 0x prefix)
  const cleanKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
  const publicKeyRegex = /^[a-fA-F0-9]{64}$/;
  return publicKeyRegex.test(cleanKey);
}

/**
 * Validate network name or chain ID
 */
export function isValidNetwork(network: string): boolean {
  // Check if it's a supported network name
  const networkNames = Object.values(SUPPORTED_NETWORKS).map(n => n.name.toLowerCase());
  if (networkNames.includes(network.toLowerCase())) {
    return true;
  }

  // Check if it's a supported chain ID
  const chainIds = Object.values(SUPPORTED_NETWORKS).map(n => n.chainId);
  if (chainIds.includes(network)) {
    return true;
  }

  // Check if it's a network key
  if (Object.keys(SUPPORTED_NETWORKS).includes(network.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Sanitize wallet address (ensure proper format)
 */
export function sanitizeWalletAddress(address: string): string {
  if (!address) return '';
  
  // Ensure address starts with 0x
  const cleanAddress = address.toLowerCase();
  if (!cleanAddress.startsWith('0x')) {
    return `0x${cleanAddress}`;
  }
  
  return cleanAddress;
}

/**
 * Validate and normalize network information
 */
export function validateAndNormalizeNetwork(networkInput: string | { name?: string; chainId?: string }): {
  isValid: boolean;
  network?: string;
  chainId?: string;
  error?: string;
} {
  try {
    let networkName: string;
    let chainId: string;

    // Handle string input
    if (typeof networkInput === 'string') {
      const network = getNetworkByChainId(networkInput);
      if (network) {
        networkName = network.name;
        chainId = network.chainId;
      } else {
        // Try to find by name
        const foundNetwork = Object.values(SUPPORTED_NETWORKS).find(
          n => n.name.toLowerCase() === networkInput.toLowerCase()
        );
        if (foundNetwork) {
          networkName = foundNetwork.name;
          chainId = foundNetwork.chainId;
        } else {
          return {
            isValid: false,
            error: `Unsupported network: ${networkInput}`
          };
        }
      }
    } else {
      // Handle object input
      if (networkInput.chainId) {
        const network = getNetworkByChainId(networkInput.chainId);
        if (network) {
          networkName = network.name;
          chainId = network.chainId;
        } else {
          return {
            isValid: false,
            error: `Unsupported chain ID: ${networkInput.chainId}`
          };
        }
      } else if (networkInput.name) {
        const foundNetwork = Object.values(SUPPORTED_NETWORKS).find(
          n => n.name.toLowerCase() === networkInput.name!.toLowerCase()
        );
        if (foundNetwork) {
          networkName = foundNetwork.name;
          chainId = foundNetwork.chainId;
        } else {
          return {
            isValid: false,
            error: `Unsupported network: ${networkInput.name}`
          };
        }
      } else {
        return {
          isValid: false,
          error: 'Network name or chain ID is required'
        };
      }
    }

    return {
      isValid: true,
      network: networkName,
      chainId: chainId
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Network validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Retry mechanism for wallet operations
 */
export class RetryManager {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's the last attempt or if we shouldn't retry this error
        if (attempt === this.maxRetries || !shouldRetry(error)) {
          break;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetryError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  
  // Don't retry user rejection or wallet not installed
  if (message.includes('rejected') || 
      message.includes('user denied') ||
      message.includes('not installed') ||
      message.includes('not found')) {
    return false;
  }

  // Don't retry validation errors
  if (message.includes('invalid') || 
      message.includes('malformed')) {
    return false;
  }

  // Retry network errors, timeouts, and temporary issues
  if (message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('temporary')) {
    return true;
  }

  // Default to not retrying unknown errors
  return false;
}