'use client';
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has dark mode preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-4 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-700">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Revolutionizing Real Estate Investment
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Fractional Real Estate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Powered by Blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Join the future of property investment. Start with as little as $100 and<br />
              own a piece of premium real estate through secure blockchain technology.
            </p>
            <div className="flex gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/properties"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-lg inline-flex items-center gap-2 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300"
                >
                  Browse Properties
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/list-property"
                  className="px-8 py-4 border-2 border-gray-700 text-white rounded-lg hover:bg-gray-800/50 transition-colors duration-300 inline-flex items-center gap-2"
                >
                  List Your Property
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 px-4"
          >
            {[
              { value: "$50M+", label: "Total Property Value" },
              { value: "10,000+", label: "Active Investors" },
              { value: "500+", label: "Properties Listed" },
              { value: "98%", label: "Success Rate" }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                title: "For Investors",
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                items: [
                  "Fractional property ownership",
                  "Low minimum investment",
                  "Transparent blockchain records",
                  "Automated dividend payments"
                ]
              },
              {
                title: "For Property Owners",
                icon: (
                  <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                items: [
                  "List your property",
                  "Reach global investors",
                  "Smart contract automation",
                  "Secure transactions"
                ]
              },
              {
                title: "For Renters",
                icon: (
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                ),
                items: [
                  "Browse available properties",
                  "Transparent rental terms",
                  "Digital lease agreements",
                  "Automated payments"
                ]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="p-8 rounded-2xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-shadow duration-300"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {feature.title}
                </h3>
                <ul className="space-y-4 text-gray-300">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-blue-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative text-center rounded-2xl p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-gray-700/50"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Ready to Start Your Real Estate Investment Journey?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join thousands of investors already growing their portfolio with PropChain
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] inline-block transition-all duration-300"
                >
                  Create Your Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-20 py-12 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 text-sm text-gray-400">
              {[
                {
                  title: "About",
                  links: [
                    { href: "/about", text: "About Us" },
                    { href: "/how-it-works", text: "How It Works" },
                    { href: "/team", text: "Our Team" }
                  ]
                },
                {
                  title: "Investors",
                  links: [
                    { href: "/properties", text: "Browse Properties" },
                    { href: "/investment-guide", text: "Investment Guide" },
                    { href: "/faq", text: "FAQ" }
                  ]
                },
                {
                  title: "Property Owners",
                  links: [
                    { href: "/list-property", text: "List Property" },
                    { href: "/owner-guide", text: "Owner Guide" },
                    { href: "/support", text: "Support" }
                  ]
                },
                {
                  title: "Legal",
                  links: [
                    { href: "/privacy", text: "Privacy Policy" },
                    { href: "/terms", text: "Terms of Service" },
                    { href: "/compliance", text: "Compliance" }
                  ]
                }
              ].map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link, i) => (
                      <li key={i}>
                        <Link 
                          href={link.href}
                          className="hover:text-blue-400 transition-colors duration-300"
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
