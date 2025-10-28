/**
 * Petra Wallet Adapter - Core wallet interaction layer
 */

import { 
  WalletAdapter, 
  ConnectionResult,
  WalletNotInstalledError,
  ConnectionRejectedError,
  WalletLockedError,
  UnknownWalletError,
  PETRA_WALLET_NAME,
  CONNECTION_TIMEOUT,
  isValidAptosAddress,
  WALLET_EVENTS,
  validateConnectionData,
  sanitizeWalletAddress,
  validateAndNormalizeNetwork,
  RetryManager,
  shouldRetryError,
  ErrorReporter
} from './index';

// Petra wallet interface (from browser extension)
interface PetraWallet {
  connect(): Promise<{
    address: string;
    publicKey: string;
  }>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  account(): Promise<{
    address: string;
    publicKey: string;
  }>;
  network(): Promise<{
    name: string;
    chainId: string;
    url: string;
  }>;
  onAccountChange(callback: (account: string) => void): void;
  onNetworkChange(callback: (network: any) => void): void;
  removeAllListeners?(): void;
}

// Global window interface extension
declare global {
  interface Window {
    aptos?: PetraWallet;
    petra?: PetraWallet;
  }
}

export class PetraWalletAdapter implements WalletAdapter {
  private wallet: PetraWallet | null = null;
  private accountChangeCallback: ((account: string) => void) | null = null;
  private networkChangeCallback: ((network: string) => void) | null = null;
  private retryManager: RetryManager;

  constructor() {
    this.detectWallet();
    this.retryManager = new RetryManager(3, 1000);
  }

  /**
   * Detect if Petra wallet is installed and available
   */
  private detectWallet(): void {
    // Check for Petra wallet in different possible locations
    if (typeof window !== 'undefined') {
      // Wait for wallet to be available
      this.wallet = window.aptos || null;
      
      // If not immediately available, try again after a short delay
      if (!this.wallet) {
        setTimeout(() => {
          this.wallet = window.aptos || null;
        }, 100);
      }
    }
  }

  /**
   * Check if Petra wallet is installed
   */
  private isWalletInstalled(): boolean {
    return this.wallet !== null;
  }

  /**
   * Connect to Petra wallet with enhanced error handling and validation
   */
  async connect(): Promise<{
    address: string;
    publicKey: string;
    network: string;
  }> {
    return this.retryManager.executeWithRetry(
      async () => {
        try {
          // Check if wallet is installed
          if (!this.isWalletInstalled()) {
            throw new WalletNotInstalledError();
          }

          if (!this.wallet) {
            throw new WalletNotInstalledError();
          }

          // Debug: Log wallet detection
          console.log('Petra wallet detected:', !!this.wallet);
          console.log('Wallet object:', this.wallet);

          // Set up connection timeout
          const connectPromise = this.wallet.connect();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT);
          });

          // Race between connection and timeout
          console.log('Attempting to connect to Petra wallet...');
          const result = await Promise.race([connectPromise, timeoutPromise]) as {
            address: string;
            publicKey: string;
          };

          console.log('Connection result:', result);

          // Get current network
          const networkInfo = await this.getNetwork();

          // Sanitize and validate connection data
          const sanitizedAddress = sanitizeWalletAddress(result.address);
          
          const connectionData = {
            address: sanitizedAddress,
            publicKey: result.publicKey,
            network: networkInfo,
          };

          // Validate the connection data
          const validation = validateConnectionData(connectionData);
          if (!validation.isValid) {
            throw new UnknownWalletError(`Invalid connection data: ${validation.error}`);
          }

          // Validate and normalize network
          const networkValidation = validateAndNormalizeNetwork(networkInfo);
          if (!networkValidation.isValid) {
            console.warn('Network validation warning:', networkValidation.error);
            // Don't throw here, just log the warning
          }

          return {
            address: sanitizedAddress,
            publicKey: result.publicKey,
            network: networkValidation.network || networkInfo,
          };

        } catch (error: any) {
          // Report error with context
          ErrorReporter.reportError(error, {
            operation: 'wallet_connect',
            additionalData: {
              walletInstalled: this.isWalletInstalled(),
              timestamp: Date.now()
            }
          });

          // Handle specific error cases
          if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
            throw new ConnectionRejectedError();
          }
          
          if (error.message?.includes('locked')) {
            throw new WalletLockedError();
          }

          if (error instanceof WalletNotInstalledError) {
            throw error;
          }

          if (error instanceof ConnectionRejectedError || 
              error instanceof WalletLockedError ||
              error instanceof UnknownWalletError) {
            throw error;
          }

          // Default to unknown error
          throw new UnknownWalletError(`Connection failed: ${error.message}`);
        }
      },
      shouldRetryError
    );
  }

  /**
   * Disconnect from Petra wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (this.wallet) {
        await this.wallet.disconnect();
        
        // Remove event listeners
        this.removeEventListeners();
      }
    } catch (error: any) {
      console.error('Petra wallet disconnect error:', error);
      // Don't throw on disconnect errors, just log them
    }
  }

  /**
   * Check if wallet is currently connected
   */
  isConnected(): boolean {
    if (!this.isWalletInstalled() || !this.wallet) {
      return false;
    }

    try {
      // Note: Petra's isConnected is async, but we need sync for this interface
      // We'll rely on the account check in the context layer
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current connected account
   */
  async getAccount(): Promise<string | null> {
    try {
      if (!this.isWalletInstalled() || !this.wallet) {
        return null;
      }

      const accountInfo = await this.wallet.account();
      return accountInfo?.address || null;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }

  /**
   * Get current network information
   */
  async getNetwork(): Promise<string> {
    try {
      if (!this.isWalletInstalled() || !this.wallet) {
        return 'unknown';
      }

      const networkInfo = await this.wallet.network();
      return networkInfo.name || networkInfo.chainId || 'unknown';
    } catch (error) {
      console.error('Error getting network:', error);
      return 'unknown';
    }
  }

  /**
   * Set up account change listener
   */
  onAccountChange(callback: (account: string) => void): void {
    if (!this.isWalletInstalled() || !this.wallet) {
      return;
    }

    try {
      this.accountChangeCallback = callback;
      this.wallet.onAccountChange((account: string) => {
        if (isValidAptosAddress(account)) {
          callback(account);
        }
      });
    } catch (error) {
      console.error('Error setting up account change listener:', error);
    }
  }

  /**
   * Set up network change listener
   */
  onNetworkChange(callback: (network: string) => void): void {
    if (!this.isWalletInstalled() || !this.wallet) {
      return;
    }

    try {
      this.networkChangeCallback = callback;
      this.wallet.onNetworkChange((networkInfo: any) => {
        const network = networkInfo?.name || networkInfo?.chainId || 'unknown';
        callback(network);
      });
    } catch (error) {
      console.error('Error setting up network change listener:', error);
    }
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    try {
      if (this.wallet && typeof this.wallet.removeAllListeners === 'function') {
        this.wallet.removeAllListeners();
      }
      
      this.accountChangeCallback = null;
      this.networkChangeCallback = null;
    } catch (error) {
      console.error('Error removing event listeners:', error);
    }
  }

  /**
   * Get wallet info for debugging
   */
  getWalletInfo(): {
    isInstalled: boolean;
    walletName: string;
    isConnected: boolean;
  } {
    return {
      isInstalled: this.isWalletInstalled(),
      walletName: PETRA_WALLET_NAME,
      isConnected: this.isConnected(),
    };
  }

  /**
   * Cleanup method to be called when adapter is no longer needed
   */
  cleanup(): void {
    this.removeEventListeners();
    this.wallet = null;
  }
}