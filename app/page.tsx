import Link from "next/link"
import Image from "next/image"
import WaitlistJoin from "@/components/waitlist-join"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur border-b border-white">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            TESSERAPT
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/community" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Connect
            </Link>
            <Link href="https://tesseraptdocs.tiiny.site" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 container mx-auto">
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-12 md:col-span-7 mb-8 md:mb-0">
            <h1 className="text-8xl md:text-9xl font-bold tracking-tighter leading-none mb-6 text-pretty">
              P*NDLE
              <br />
              ON APTOS
              <br />
              BUT BETTER.
            </h1>
            <p className="text-xl max-w-xl mb-4">
              AI-powered DeFi yield maximizer with native lending on Aptos.
            </p>
            <p className="text-lg max-w-xl text-white/80">
              Intelligent capital allocation for optimized returns.
            </p>
          </div>

          <div className="col-span-12 md:col-span-5 flex flex-col items-center justify-start gap-6">
            <div className="relative w-full aspect-square bg-black overflow-hidden">
              <Image
                src="/images/ttlogo.png"
                alt="Tesserapt logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </div>
            <WaitlistJoin />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 border-t border-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">sincerely, team Tesserapt</p>
          <div className="flex space-x-8">
            <a href="/community" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Connect
            </a>
            <a href="https://tesseraptdocs.tiiny.site" className="text-sm uppercase tracking-widest hover:text-red-600 transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
