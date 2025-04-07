import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import Image from "next/image"
import Link from "next/link"
import './globals.css'
import Script from 'next/script'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PropChain - Real Estate Investment Platform',
  description: 'Fractional real estate investment powered by blockchain technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning={true} className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0F1C]`}>
          <nav className="flex justify-between items-center px-6 py-4 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="PropChain Logo"
                  width={40}
                  height={40}
                  priority
                  className="hover:rotate-12 transition-transform duration-300"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                  PropChain
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-6">
              <SignedOut>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </nav>
          <main>
            {children}
          </main>
          
          {/* Prevent Grammarly extension from adding attributes that cause hydration warnings */}
          <Script id="disable-grammarly" strategy="beforeInteractive">
            {`
              if (typeof window !== 'undefined') {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'data-gr-ext-installed' || 
                         mutation.attributeName === 'data-new-gr-c-s-check-loaded')) {
                      const element = mutation.target;
                      element.removeAttribute(mutation.attributeName);
                    }
                  });
                });
                
                // Start observing once the DOM is ready
                document.addEventListener('DOMContentLoaded', () => {
                  observer.observe(document.body, { 
                    attributes: true,
                    attributeFilter: ['data-gr-ext-installed', 'data-new-gr-c-s-check-loaded']
                  });
                });
              }
            `}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  )
}
