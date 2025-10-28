"use client"

import type React from "react"

import { useState } from "react"
import { useWallet, WalletProvider } from "@/lib/wallet"

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzmYjWWcvYYTIzo-vaYQtRJ9XCHJV_GUzYZS_xfwsgngfDRseuXTP4ItdbZ5irMi0oU/exec"

function WaitlistJoinInner() {
  const [mode, setMode] = useState<"closed" | "waitlist" | "wallet">("closed")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)
  
  // Use wallet hook
  const { 
    isConnected, 
    isConnecting, 
    account, 
    formattedAddress, 
    connect, 
    disconnect, 
    error: walletError,
    clearError 
  } = useWallet()

  async function handleWalletConnect() {
    try {
      clearError()
      await connect()
    } catch (err) {
      console.error("Wallet connection failed:", err)
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email) return
    setStatus("loading")
    setMessage(null)
    try {
      const payload = mode === "wallet" 
        ? { email, walletAddress: account, type: "wallet" }
        : { email, type: "waitlist" }
      
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors", // Apps Script often requires no-cors for anonymous writes
      })
      // In no-cors, we can't read response. Assume success.
      setStatus("success")
      const successMessage = mode === "wallet" 
        ? "Thanks! We'll be in touch soon"
        : "Thanks for joining, We'll start digging soon"
      setMessage(successMessage)
      setEmail("")
      setMode("closed")
    } catch (err) {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (mode === "closed") {
    if (status === "success") {
      return <p className="text-white">{message}</p>
    }
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode("waitlist")}
          className="px-6 py-3 bg-white text-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-colors"
          aria-label="Join Waitlist"
        >
          Join&nbsp;Waitlist
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {mode === "waitlist" ? "Join Waitlist" : "Connect Wallet"}
        </h3>
        <div className="flex items-center gap-3">
          {mode === "waitlist" && (
            <button
              onClick={() => setMode("wallet")}
              className="px-4 py-2 bg-transparent border border-white text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              aria-label="Connect Wallet"
            >
              Connect Wallet
            </button>
          )}
          <button
            onClick={() => setMode("closed")}
            className="text-white/60 hover:text-white text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-black text-white border border-white px-4 py-3 placeholder-white/50 focus:outline-none"
          />
        </div>
        
        {mode === "wallet" && (
          <div className="space-y-4">
            {/* Wallet Connection Section */}
            <div className="border border-white/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Petra Wallet</h4>
              
              {!isConnected ? (
                <div className="space-y-3">
                  <button
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                    className="w-full px-4 py-3 bg-transparent border border-white text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? "Connecting..." : "Connect Petra Wallet"}
                  </button>
                  
                  {walletError && (
                    <div className="text-red-400 text-xs p-2 border border-red-400/20 rounded">
                      {walletError}
                      <button
                        onClick={clearError}
                        className="ml-2 underline hover:no-underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-white/60">
                    Connect your Petra wallet to automatically fill your Aptos address. 
                    Don't have Petra? <a 
                      href="https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      Install it here
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-400/20 rounded">
                    <div>
                      <p className="text-green-400 text-sm font-medium">Connected</p>
                      <p className="text-white/80 text-xs font-mono">{formattedAddress}</p>
                    </div>
                    <button
                      onClick={disconnect}
                      className="text-white/60 hover:text-white text-xs underline"
                    >
                      Disconnect
                    </button>
                  </div>
                  
                  <p className="text-xs text-white/60">
                    Your wallet address will be automatically included with your submission.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={status === "loading" || (mode === "wallet" && !isConnected)}
          className="px-5 py-3 bg-white text-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-70"
        >
          {status === "loading" ? "Submitting..." : 
           mode === "wallet" && !isConnected ? "Connect Wallet First" : 
           "Submit"}
        </button>
        
        {message && (
          <p className="text-sm text-center" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}

// Wrapper component with WalletProvider
export function WaitlistJoin() {
  return (
    <WalletProvider>
      <WaitlistJoinInner />
    </WalletProvider>
  )
}

export default WaitlistJoin
