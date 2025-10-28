/**
 * Error recovery and resilience utilities for wallet operations
 */

import {
  WalletNotInstalledError,
  ConnectionRejectedError,
  NetworkUnsupportedError,
  WalletLockedError,
  UnknownWalletError,
  handleWalletError,
  PETRA_DOWNLOAD_URL
} from './index';

// Recovery action types
export type RecoveryAction = 
  | 'install_wallet'
  | 'unlock_wallet' 
  | 'switch_network'
  | 'retry_connection'
  | 'refresh_page'
  | 'contact_support';

// Recovery suggestion interface
export interface RecoveryStrategy {
  action: RecoveryAction;
  title: string;
  description: string;
  actionUrl?: string;
  isAutomatic?: boolean;
  priority: number; // Lower number = higher priority
}

/**
 * Get recovery strategies for different error types
 */
export function getRecoveryStrategies(error: unknown): RecoveryStrategy[] {
  const strategies: RecoveryStrategy[] = [];

  if (error instanceof WalletNotInstalledError) {
    strategies.push({
      action: 'install_wallet',
      title: 'Install Petra Wallet',
      description: 'Download and install the Petra wallet browser extension',
      actionUrl: PETRA_DOWNLOAD_URL,
      priority: 1
    });
  }

  if (error instanceof ConnectionRejectedError) {
    strategies.push({
      action: 'retry_connection',
      title: 'Try Again',
      description: 'Click the connect button again and approve the connection',
      priority: 1
    });
  }

  if (error instanceof WalletLockedError) {
    strategies.push({
      action: 'unlock_wallet',
      title: 'Unlock Wallet',
      description: 'Open your Petra wallet and enter your password to unlock it',
      priority: 1
    });
  }

  if (error instanceof NetworkUnsupportedError) {
    strategies.push({
      action: 'switch_network',
      title: 'Switch Network',
      description: 'Change to a supported network (Mainnet, Testnet, or Devnet) in your Petra wallet',
      priority: 1
    });
  }

  if (error instanceof UnknownWalletError) {
    strategies.push(
      {
        action: 'retry_connection',
        title: 'Retry Connection',
        description: 'Try connecting again - this might be a temporary issue',
        priority: 1
      },
      {
        action: 'refresh_page',
        title: 'Refresh Page',
        description: 'Refresh the page and try connecting again',
        priority: 2
      }
    );
  }

  // Generic fallback strategies
  if (strategies.length === 0) {
    strategies.push(
      {
        action: 'retry_connection',
        title: 'Try Again',
        description: 'Retry the wallet connection',
        priority: 2
      },
      {
        action: 'refresh_page',
        title: 'Refresh Page',
        description: 'Refresh the page and try again',
        priority: 3
      }
    );
  }

  // Always add contact support as last resort
  strategies.push({
    action: 'contact_support',
    title: 'Contact Support',
    description: 'If the problem persists, please contact our support team',
    priority: 10
  });

  // Sort by priority
  return strategies.sort((a, b) => a.priority - b.priority);
}

/**
 * Auto-recovery manager for handling automatic error recovery
 */
export class AutoRecoveryManager {
  private recoveryAttempts: Map<string, number> = new Map();
  private maxAutoRetries = 2;
  private retryDelay = 2000; // 2 seconds

  /**
   * Attempt automatic recovery for an error
   */
  async attemptAutoRecovery(
    error: unknown,
    retryCallback: () => Promise<void>
  ): Promise<boolean> {
    const errorKey = this.getErrorKey(error);
    const attempts = this.recoveryAttempts.get(errorKey) || 0;

    // Don't auto-retry if we've exceeded max attempts
    if (attempts >= this.maxAutoRetries) {
      return false;
    }

    // Only auto-retry certain types of errors
    if (!this.shouldAutoRecover(error)) {
      return false;
    }

    try {
      // Increment attempt counter
      this.recoveryAttempts.set(errorKey, attempts + 1);

      // Wait before retrying
      await this.delay(this.retryDelay * (attempts + 1));

      // Attempt recovery
      await retryCallback();

      // Success - reset counter
      this.recoveryAttempts.delete(errorKey);
      return true;

    } catch (recoveryError) {
      console.error('Auto-recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Reset recovery attempts for a specific error type
   */
  resetRecoveryAttempts(error: unknown): void {
    const errorKey = this.getErrorKey(error);
    this.recoveryAttempts.delete(errorKey);
  }

  /**
   * Clear all recovery attempts
   */
  clearAllRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
  }

  /**
   * Check if an error should be auto-recovered
   */
  private shouldAutoRecover(error: unknown): boolean {
    // Don't auto-retry user rejections or missing wallet
    if (error instanceof ConnectionRejectedError || 
        error instanceof WalletNotInstalledError) {
      return false;
    }

    // Auto-retry network issues and unknown errors
    if (error instanceof NetworkUnsupportedError || 
        error instanceof UnknownWalletError) {
      return true;
    }

    // Check error message for temporary issues
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') || 
             message.includes('temporary');
    }

    return false;
  }

  /**
   * Generate a unique key for error tracking
   */
  private getErrorKey(error: unknown): string {
    if (error instanceof Error) {
      return `${error.constructor.name}:${error.message}`;
    }
    return 'unknown_error';
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error context for better error reporting
 */
export interface ErrorContext {
  operation: string;
  timestamp: number;
  userAgent?: string;
  walletVersion?: string;
  networkInfo?: string;
  additionalData?: Record<string, any>;
}

/**
 * Enhanced error reporter with context
 */
export class ErrorReporter {
  /**
   * Report error with context for debugging
   */
  static reportError(error: unknown, context: Partial<ErrorContext> = {}): void {
    const errorReport = {
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      context: {
        operation: context.operation || 'unknown',
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...context
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Wallet Error Report');
      console.error('Error:', errorReport.error);
      console.info('Context:', errorReport.context);
      console.groupEnd();
    }

    // In production, you might want to send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // this.sendToErrorService(errorReport);
  }

  /**
   * Create user-friendly error message with recovery suggestions
   */
  static createUserMessage(error: unknown): {
    title: string;
    message: string;
    recoveryStrategies: RecoveryStrategy[];
  } {
    const userMessage = handleWalletError(error);
    const strategies = getRecoveryStrategies(error);

    let title = 'Connection Error';
    
    if (error instanceof WalletNotInstalledError) {
      title = 'Wallet Not Found';
    } else if (error instanceof ConnectionRejectedError) {
      title = 'Connection Rejected';
    } else if (error instanceof WalletLockedError) {
      title = 'Wallet Locked';
    } else if (error instanceof NetworkUnsupportedError) {
      title = 'Network Not Supported';
    }

    return {
      title,
      message: userMessage,
      recoveryStrategies: strategies
    };
  }
}