/**
 * Wallet integration exports
 */

// Types
export type {
  WalletState,
  WalletContextType,
  WalletAdapter,
  ConnectionResult,
  NetworkConfig,
  WalletConnectButtonProps,
  WalletDisplayProps,
  MockWalletAdapter,
} from './types';

// Error classes and utilities
export {
  WalletNotInstalledError,
  ConnectionRejectedError,
  NetworkUnsupportedError,
  WalletLockedError,
  UnknownWalletError,
  ERROR_MESSAGES,
  handleWalletError,
} from './errors';

export type { WalletError } from './errors';

// Constants and utilities
export {
  SUPPORTED_NETWORKS,
  DEFAULT_NETWORK,
  STORAGE_KEYS,
  CONNECTION_TIMEOUT,
  AUTO_RECONNECT_DELAY,
  MAX_RECONNECT_ATTEMPTS,
  ADDRESS_DISPLAY,
  PETRA_WALLET_NAME,
  PETRA_DOWNLOAD_URL,
  WALLET_EVENTS,
  formatWalletAddress,
  isValidAptosAddress,
  getNetworkByChainId,
  isNetworkSupported,
} from './constants';

// Wallet adapter
export { PetraWalletAdapter } from './petra-adapter';

// Validation utilities
export {
  validateConnectionData,
  isValidPublicKey,
  isValidNetwork,
  sanitizeWalletAddress,
  validateAndNormalizeNetwork,
  RetryManager,
  shouldRetryError,
} from './validation';

export type { ValidationResult, ConnectionData } from './validation';

// Error recovery
export {
  getRecoveryStrategies,
  AutoRecoveryManager,
  ErrorReporter,
} from './error-recovery';

export type { 
  RecoveryAction, 
  RecoveryStrategy, 
  ErrorContext 
} from './error-recovery';

// React components and hooks
export { 
  WalletProvider, 
  WalletConfigProvider, 
  useWalletConfig 
} from './wallet-provider';

export { 
  useWalletContext 
} from './wallet-context';

export type { WalletProviderConfig } from './wallet-provider';

// Wallet hooks
export {
  useWallet,
  useWalletConnection,
  useWalletAccount,
  useWalletNetwork,
  useWalletError,
  useWalletReady,
  useWalletUtils,
} from './hooks';

export type { WalletHookState } from './hooks';

// Advanced connection hooks
export {
  useConnectionStatus,
  useConnectionTimeout,
  useConnectionRetry,
} from './connection-hooks';

export type { 
  ConnectionState, 
  ConnectionManager 
} from './connection-hooks';