"use client"

import type React from "react"

import { useState } from "react"

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzmYjWWcvYYTIzo-vaYQtRJ9XCHJV_GUzYZS_xfwsgngfDRseuXTP4ItdbZ5irMi0oU/exec"

export function WaitlistJoin() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email) return
    setStatus("loading")
    setMessage(null)
    try {
      const payload = {
        email,
        walletAddress: walletAddress || null,
        type: "waitlist_with_wallet"
      }
      
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors", // Apps Script often requires no-cors for anonymous writes
      })
      // In no-cors, we can't read response. Assume success.
      setStatus("success")
      setMessage("Thanks! We'll be in touch soon with early access details.")
      setEmail("")
      setWalletAddress("")
      setIsOpen(false)
    } catch (err) {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (!isOpen) {
    if (status === "success") {
      return (
        <div className="text-center">
          <p className="text-white text-lg mb-4">{message}</p>
          <button
            onClick={() => setStatus("idle")}
            className="px-6 py-3 bg-transparent border border-white text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            Join Again
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-6 py-3 bg-white text-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-colors"
          aria-label="Join Waitlist"
        >
          Join Waitlist
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Join Waitlist</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 hover:text-white text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-white mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-black text-white border border-white px-4 py-3 placeholder-white/50 focus:outline-none focus:border-white/80 transition-colors"
          />
        </div>
        
        {/* Wallet Address Field */}
        <div>
          <label className="block text-sm font-medium text-white mb-2" htmlFor="wallet">
            Aptos Wallet Address <span className="text-white/60">(Optional)</span>
          </label>
          <input
            id="wallet"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x1234...abcd or leave empty"
            className="w-full bg-black text-white border border-white px-4 py-3 placeholder-white/50 focus:outline-none focus:border-white/80 transition-colors font-mono text-sm"
          />
          <p className="text-xs text-white/60 mt-2">
            Add your Aptos wallet address to get priority access. Don't have one? No problem!
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="w-full px-6 py-3 bg-white text-black text-sm uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {status === "loading" ? "Submitting..." : "Submit"}
        </button>
        
        {/* Error Message */}
        {message && status === "error" && (
          <div className="p-3 border border-red-400/20 bg-red-900/20 rounded">
            <p className="text-red-400 text-sm text-center" role="status" aria-live="polite">
              {message}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

export default WaitlistJoin
