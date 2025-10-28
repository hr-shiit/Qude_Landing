import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Tesserapt — Next-Generation Borrowing Aggregator on Aptos",
  description:
    "Tesserapt is a borrowing aggregator protocol on Aptos for executing the Buy Borrow Die (BBD) strategy with xBTC tokens. Stake, borrow, and refinance with Petra Wallet integration.",
  generator: 'v0.app',
  icons: {
    icon: '/images/logof1.png',
    shortcut: '/images/logof1.png',
    apple: '/images/logof1.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>{children}</body>
    </html>
  )
}
