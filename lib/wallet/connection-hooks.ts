'use client';

/**
 * Advanced wallet connection hooks with enhanced connection management
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWalletContext } from './wallet-context';
import { 
  getRecoveryStrategies, 
  AutoRecoveryManager,
  ErrorReporter,
  RecoveryStrategy 
} from './index';

// Connection state interface
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnectionAttempt: number | null;
  connectionAttempts: number;
  recoveryStrategies: RecoveryStrategy[];
}

// Connection management interface
export interface ConnectionManager {
  // State
  state: ConnectionState;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  
  // Recovery
  attemptAutoRecovery: () => Promise<boolean>;
  getRecoveryOptions: () => RecoveryStrategy[];
  
  // Status checks
  canConnect: boolean;
  canRetry: boolean;
  shouldShowRecovery: boolean;
}

/**
 * Enhanced wallet connection hook with advanced connection management
 */
export function useWalletConnection(): ConnectionManager {
  const context = useWalletContext();
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number | null>(null);
  const autoRecoveryManager = useRef<AutoRecoveryManager | null>(null);

  // Initialize auto recovery manager
  useEffect(() => {
    autoRecoveryManager.current = new AutoRecoveryManager();
    return () => {
      autoRecoveryManager.current = null;
    };
  }, []);

  // Reset connection attempts on successful connection
  useEffect(() => {
    if (context.isConnected) {
      setConnectionAttempts(0);
      setLastConnectionAttempt(null);
    }
  }, [context.isConnected]);

  // Enhanced connect function
  const connect = useCallback(async (): Promise<void> => {
    try {
      setConnectionAttempts(prev => prev + 1);
      setLastConnectionAttempt(Date.now());
      
      await context.connect();
      
      // Reset attempts on success
      setConnectionAttempts(0);
      
    } catch (error) {
      ErrorReporter.reportError(error, {
        operation: 'enhanced_wallet_connect',
        additionalData: {
          attempt: connectionAttempts + 1,
          timestamp: Date.now()
        }
      });
      
      throw error;
    }
  }, [context, connectionAttempts]);

  // Enhanced disconnect function
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await context.disconnect();
      
      // Reset connection state
      setConnectionAttempts(0);
      setLastConnectionAttempt(null);
      
    } catch (error) {
      ErrorReporter.reportError(error, {
        operation: 'enhanced_wallet_disconnect',
        additionalData: {
          timestamp: Date.now()
        }
      });
      
      // Don't throw on disconnect errors
      console.warn('Disconnect error:', error);
    }
  }, [context]);

  // Retry connection
  const retry = useCallback(async (): Promise<void> => {
    context.clearError();
    await connect();
  }, [context, connect]);

  // Attempt auto recovery
  const attemptAutoRecovery = useCallback(async (): Promise<boolean> => {
    if (!autoRecoveryManager.current || !context.error) {
      return false;
    }

    try {
      const recovered = await autoRecoveryManager.current.attemptAutoRecovery(
        new Error(context.error),
        async () => {
          await connect();
        }
      );

      return recovered;
    } catch (error) {
      console.error('Auto recovery failed:', error);
      return false;
    }
  }, [context.error, connect]);

  // Get recovery strategies
  const getRecoveryOptions = useCallback((): RecoveryStrategy[] => {
    if (!context.error) return [];
    
    return getRecoveryStrategies(new Error(context.error));
  }, [context.error]);

  // Clear error
  const clearError = useCallback((): void => {
    context.clearError();
    
    // Reset auto recovery attempts
    if (autoRecoveryManager.current) {
      autoRecoveryManager.current.clearAllRecoveryAttempts();
    }
  }, [context]);

  // Computed state
  const state: ConnectionState = {
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    error: context.error,
    lastConnectionAttempt,
    connectionAttempts,
    recoveryStrategies: getRecoveryOptions(),
  };

  // Status checks
  const canConnect = !context.isConnected && !context.isConnecting;
  const canRetry = Boolean(context.error) && !context.isConnecting;
  const shouldShowRecovery = Boolean(context.error) && connectionAttempts > 1;

  return {
    state,
    connect,
    disconnect,
    retry,
    clearError,
    attemptAutoRecovery,
    getRecoveryOptions,
    canConnect,
    canRetry,
    shouldShowRecovery,
  };
}

/**
 * Hook for connection status monitoring
 */
export function useConnectionStatus() {
  const { isConnected, isConnecting, error } = useWalletContext();
  const [connectionHistory, setConnectionHistory] = useState<{
    timestamp: number;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  }[]>([]);

  // Track connection status changes
  useEffect(() => {
    const newEntry = {
      timestamp: Date.now(),
      status: error ? 'error' as const : 
              isConnected ? 'connected' as const : 
              'disconnected' as const,
      error: error || undefined,
    };

    setConnectionHistory(prev => [...prev.slice(-9), newEntry]); // Keep last 10 entries
  }, [isConnected, error]);

  const lastConnected = connectionHistory
    .filter(entry => entry.status === 'connected')
    .pop()?.timestamp || null;

  const lastError = connectionHistory
    .filter(entry => entry.status === 'error')
    .pop() || null;

  return {
    isConnected,
    isConnecting,
    error,
    connectionHistory,
    lastConnected,
    lastError,
  };
}

/**
 * Hook for connection timeout management
 */
export function useConnectionTimeout(timeoutMs = 30000) {
  const { isConnecting } = useWalletContext();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnecting) {
      setIsTimedOut(false);
      
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true);
      }, timeoutMs);
    } else {
      setIsTimedOut(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConnecting, timeoutMs]);

  return {
    isTimedOut,
    timeoutMs,
  };
}

/**
 * Hook for connection retry logic
 */
export function useConnectionRetry(maxRetries = 3, retryDelay = 2000) {
  const context = useWalletContext();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canRetry = retryCount < maxRetries && Boolean(context.error) && !context.isConnecting;

  const retry = useCallback(async (): Promise<void> => {
    if (!canRetry) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Wait for retry delay
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, retryDelay * retryCount);
      });

      context.clearError();
      await context.connect();
      
      // Reset on success
      setRetryCount(0);
    } catch (error) {
      // Error will be handled by the context
    } finally {
      setIsRetrying(false);
    }
  }, [canRetry, retryDelay, retryCount, context]);

  const resetRetries = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Reset retries on successful connection
  useEffect(() => {
    if (context.isConnected) {
      resetRetries();
    }
  }, [context.isConnected, resetRetries]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    retry,
    resetRetries,
    retryCount,
    maxRetries,
    canRetry,
    isRetrying,
    nextRetryDelay: retryDelay * (retryCount + 1),
  };
}