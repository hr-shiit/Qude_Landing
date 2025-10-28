'use client';

/**
 * Wallet Context - React Context for wallet state management
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  WalletContextType,
  WalletState,
  PetraWalletAdapter,
  STORAGE_KEYS,
  AUTO_RECONNECT_DELAY,
  MAX_RECONNECT_ATTEMPTS,
  handleWalletError,
  AutoRecoveryManager,
  ErrorReporter
} from './index';

// Wallet actions
type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { account: string; network: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_NETWORK'; payload: string }
  | { type: 'SET_ACCOUNT'; payload: string };

// Initial wallet state
const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  account: null,
  network: null,
  error: null,
  lastConnected: null,
};

// Wallet reducer
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
        error: null,
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        account: action.payload.account,
        network: action.payload.network,
        error: null,
        lastConnected: Date.now(),
      };

    case 'SET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        account: null,
        network: null,
        error: null,
        lastConnected: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_NETWORK':
      return {
        ...state,
        network: action.payload,
      };

    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
      };

    default:
      return state;
  }
}

// Create wallet context
const WalletContext = createContext<WalletContextType | null>(null);

// Local storage utilities
const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

// Wallet provider props
interface WalletProviderProps {
  children: React.ReactNode;
  autoReconnect?: boolean;
}

/**
 * Wallet Provider Component
 */
export function WalletProvider({ children, autoReconnect = true }: WalletProviderProps) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const walletAdapter = React.useRef<PetraWalletAdapter | null>(null);
  const autoRecoveryManager = React.useRef<AutoRecoveryManager | null>(null);
  const reconnectAttempts = React.useRef(0);

  // Initialize wallet adapter
  useEffect(() => {
    walletAdapter.current = new PetraWalletAdapter();
    autoRecoveryManager.current = new AutoRecoveryManager();

    return () => {
      if (walletAdapter.current) {
        walletAdapter.current.cleanup();
      }
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!walletAdapter.current) return;

    const adapter = walletAdapter.current;

    // Account change listener
    adapter.onAccountChange((newAccount: string) => {
      if (state.isConnected && newAccount !== state.account) {
        dispatch({ type: 'SET_ACCOUNT', payload: newAccount });
        storage.set(STORAGE_KEYS.LAST_CONNECTED_ACCOUNT, newAccount);
        
        ErrorReporter.reportError(new Error('Account changed'), {
          operation: 'account_change',
          additionalData: { newAccount, previousAccount: state.account }
        });
      }
    });

    // Network change listener
    adapter.onNetworkChange((newNetwork: string) => {
      if (state.isConnected && newNetwork !== state.network) {
        dispatch({ type: 'SET_NETWORK', payload: newNetwork });
        storage.set(STORAGE_KEYS.PREFERRED_NETWORK, newNetwork);
        
        ErrorReporter.reportError(new Error('Network changed'), {
          operation: 'network_change',
          additionalData: { newNetwork, previousNetwork: state.network }
        });
      }
    });
  }, [state.isConnected, state.account, state.network]);

  // Auto-reconnect on page load
  useEffect(() => {
    if (!autoReconnect || !walletAdapter.current) return;

    const shouldAutoReconnect = storage.get(STORAGE_KEYS.WALLET_CONNECTED) === 'true';
    const lastConnectedAccount = storage.get(STORAGE_KEYS.LAST_CONNECTED_ACCOUNT);

    if (shouldAutoReconnect && lastConnectedAccount) {
      // Delay auto-reconnect to avoid race conditions
      const timer = setTimeout(() => {
        attemptReconnection();
      }, AUTO_RECONNECT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [autoReconnect]);

  // Attempt reconnection with retry logic
  const attemptReconnection = useCallback(async () => {
    if (!walletAdapter.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    try {
      reconnectAttempts.current++;
      dispatch({ type: 'SET_CONNECTING', payload: true });

      const result = await walletAdapter.current.connect();
      
      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          account: result.address,
          network: result.network,
        },
      });

      // Update storage
      storage.set(STORAGE_KEYS.WALLET_CONNECTED, 'true');
      storage.set(STORAGE_KEYS.LAST_CONNECTED_ACCOUNT, result.address);
      storage.set(STORAGE_KEYS.PREFERRED_NETWORK, result.network);
      storage.set(STORAGE_KEYS.CONNECTION_TIMESTAMP, Date.now().toString());

      // Reset reconnect attempts on success
      reconnectAttempts.current = 0;

    } catch (error) {
      console.warn('Auto-reconnection failed:', error);
      
      // Try auto-recovery if available
      if (autoRecoveryManager.current) {
        const recovered = await autoRecoveryManager.current.attemptAutoRecovery(
          error,
          attemptReconnection
        );
        
        if (!recovered) {
          dispatch({ type: 'SET_ERROR', payload: handleWalletError(error) });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: handleWalletError(error) });
      }
    }
  }, []);

  // Connect function
  const connect = useCallback(async (): Promise<void> => {
    if (!walletAdapter.current) {
      throw new Error('Wallet adapter not initialized');
    }

    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await walletAdapter.current.connect();

      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          account: result.address,
          network: result.network,
        },
      });

      // Update storage
      storage.set(STORAGE_KEYS.WALLET_CONNECTED, 'true');
      storage.set(STORAGE_KEYS.LAST_CONNECTED_ACCOUNT, result.address);
      storage.set(STORAGE_KEYS.PREFERRED_NETWORK, result.network);
      storage.set(STORAGE_KEYS.CONNECTION_TIMESTAMP, Date.now().toString());

      // Reset reconnect attempts on successful manual connection
      reconnectAttempts.current = 0;

      ErrorReporter.reportError(new Error('Wallet connected successfully'), {
        operation: 'wallet_connect_success',
        additionalData: { account: result.address, network: result.network }
      });

    } catch (error) {
      const errorMessage = handleWalletError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      ErrorReporter.reportError(error, {
        operation: 'wallet_connect_failed',
        additionalData: { errorMessage }
      });

      throw error;
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(async (): Promise<void> => {
    if (!walletAdapter.current) return;

    try {
      await walletAdapter.current.disconnect();
    } catch (error) {
      console.warn('Disconnect error:', error);
    } finally {
      // Always update state and clear storage
      dispatch({ type: 'SET_DISCONNECTED' });
      
      // Clear storage
      storage.remove(STORAGE_KEYS.WALLET_CONNECTED);
      storage.remove(STORAGE_KEYS.LAST_CONNECTED_ACCOUNT);
      storage.remove(STORAGE_KEYS.CONNECTION_TIMESTAMP);

      // Reset reconnect attempts
      reconnectAttempts.current = 0;

      // Clear auto-recovery attempts
      if (autoRecoveryManager.current) {
        autoRecoveryManager.current.clearAllRecoveryAttempts();
      }

      ErrorReporter.reportError(new Error('Wallet disconnected'), {
        operation: 'wallet_disconnect',
        additionalData: { manual: true }
      });
    }
  }, []);

  // Clear error function
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: WalletContextType = {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    account: state.account,
    network: state.network,
    error: state.error,
    connect,
    disconnect,
    clearError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use wallet context
 */
export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  
  return context;
}