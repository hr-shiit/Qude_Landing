'use client';

/**
 * Wallet Provider - Enhanced wrapper component for wallet context
 */

import React from 'react';
import { WalletProvider as BaseWalletProvider } from './wallet-context';
import { ErrorReporter } from './index';

// Provider configuration interface
export interface WalletProviderConfig {
  autoReconnect?: boolean;
  enableErrorReporting?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  debugMode?: boolean;
}

// Enhanced wallet provider props
interface EnhancedWalletProviderProps {
  children: React.ReactNode;
  config?: WalletProviderConfig;
}

// Default configuration
const defaultConfig: Required<WalletProviderConfig> = {
  autoReconnect: true,
  enableErrorReporting: true,
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
  debugMode: process.env.NODE_ENV === 'development',
};

/**
 * Enhanced Wallet Provider with configuration options
 */
export function WalletProvider({ 
  children, 
  config = {} 
}: EnhancedWalletProviderProps) {
  const mergedConfig = { ...defaultConfig, ...config };

  // Error boundary for wallet-related errors
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message?.includes('wallet')) {
        setHasError(true);
        setError(event.error);
        
        if (mergedConfig.enableErrorReporting) {
          ErrorReporter.reportError(event.error, {
            operation: 'wallet_error_boundary',
            additionalData: { 
              source: 'global_error_handler',
              config: mergedConfig 
            }
          });
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && 
          (event.reason.message?.includes('wallet') || 
           event.reason.name?.includes('Wallet'))) {
        setHasError(true);
        setError(event.reason);
        
        if (mergedConfig.enableErrorReporting) {
          ErrorReporter.reportError(event.reason, {
            operation: 'wallet_unhandled_rejection',
            additionalData: { 
              source: 'promise_rejection_handler',
              config: mergedConfig 
            }
          });
        }
      }
    };

    if (mergedConfig.enableErrorReporting) {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [mergedConfig]);

  // Reset error boundary
  const resetError = React.useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  // Debug logging
  React.useEffect(() => {
    if (mergedConfig.debugMode) {
      console.group('🔗 Wallet Provider Initialized');
      console.log('Config:', mergedConfig);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }, [mergedConfig]);

  // Error fallback UI
  if (hasError && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Wallet Error
        </div>
        <div className="text-red-700 text-sm mb-4 text-center max-w-md">
          {error.message || 'An unexpected wallet error occurred'}
        </div>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
        {mergedConfig.debugMode && (
          <details className="mt-4 text-xs text-red-600">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-left overflow-auto max-w-md">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <BaseWalletProvider autoReconnect={mergedConfig.autoReconnect}>
      {children}
    </BaseWalletProvider>
  );
}

/**
 * Hook to get wallet provider configuration
 */
export function useWalletConfig(): WalletProviderConfig {
  return React.useContext(WalletConfigContext) || defaultConfig;
}

// Configuration context (for advanced use cases)
const WalletConfigContext = React.createContext<WalletProviderConfig | null>(null);

/**
 * Wallet configuration provider (optional, for advanced configuration)
 */
export function WalletConfigProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode; 
  config: WalletProviderConfig; 
}) {
  return (
    <WalletConfigContext.Provider value={config}>
      {children}
    </WalletConfigContext.Provider>
  );
}

// Re-export the base context hook for convenience
export { useWalletContext } from './wallet-context';