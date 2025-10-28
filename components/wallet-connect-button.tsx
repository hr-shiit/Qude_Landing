'use client';

/**
 * Standalone Wallet Connect Button Component
 */

import React from 'react';
import { useWallet } from '@/lib/wallet';
import { cn } from '@/lib/utils';

interface WalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  showAddress?: boolean;
  showNetwork?: boolean;
}

export function WalletConnectButton({
  variant = 'default',
  size = 'md',
  className,
  onConnect,
  onDisconnect,
  showAddress = true,
  showNetwork = false,
}: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    account,
    formattedAddress,
    network,
    connect,
    disconnect,
    error,
    clearError,
  } = useWallet();

  const handleConnect = async () => {
    try {
      clearError();
      await connect();
      onConnect?.();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnect?.();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-white text-black hover:bg-neutral-200',
    outline: 'bg-transparent border border-white text-white hover:bg-white hover:text-black',
    ghost: 'bg-transparent text-white hover:bg-white/10',
  };

  const baseClasses = cn(
    'font-medium uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  if (!isConnected) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={baseClasses}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {error && (
          <div className="text-red-400 text-xs p-2 border border-red-400/20 rounded max-w-xs">
            {error}
            <button
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {showAddress && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-400/20 rounded text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-white font-mono">{formattedAddress}</span>
          </div>
        )}
        
        <button
          onClick={handleDisconnect}
          className={cn(
            'text-xs underline hover:no-underline',
            variant === 'default' ? 'text-black' : 'text-white/60 hover:text-white'
          )}
        >
          Disconnect
        </button>
      </div>
      
      {showNetwork && network && (
        <div className="text-xs text-white/60">
          Network: {network}
        </div>
      )}
    </div>
  );
}

export default WalletConnectButton;