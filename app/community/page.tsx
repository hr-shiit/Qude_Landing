import Link from "next/link"

export default function Community() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white">
        <div className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            TESSERAPT
          </Link>
          <nav>
            <Link href="/" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 md:px-8 py-24">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-none mb-6 text-pretty">Connect</h1>
        <p className="text-xl mb-12 max-w-2xl text-pretty">
          Join the conversation. Share insights, surface signals, and track market momentum together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://x.com/TesserApt"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 border border-white text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors text-center"
          >
            Twitter
          </a>
        </div>
      </section>

      <footer className="py-8 px-4 md:px-8 border-t border-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">sincerely, team Tesserapt</p>
        </div>
      </footer>
    </main>
  )
}
