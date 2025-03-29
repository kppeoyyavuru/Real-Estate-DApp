'use client';
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Dashboard Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to PropChain</h1>
              <p className="text-gray-400">Explore investment and rental opportunities</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <Link href="/invest">
              <div className="h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Invest in Properties</h2>
                    <p className="text-gray-300">Start your investment journey with fractional real estate ownership</p>
                  </div>
                  <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                    Explore Investment Options
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <Link href="/rent">
              <div className="h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Rent a Property</h2>
                    <p className="text-gray-300">Find your perfect home with our curated selection of properties</p>
                  </div>
                  <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                    Browse Rental Properties
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { title: "Available Properties", value: "124", icon: "🏠" },
            { title: "Total Investors", value: "3.2K", icon: "👥" },
            { title: "Average ROI", value: "8.5%", icon: "📈" },
            { title: "Total Value Locked", value: "$12.5M", icon: "🔒" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Properties */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Luxury Apartment",
                location: "New York, NY",
                price: "$500,000",
                type: "Investment",
                return: "8.5%",
                image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500"
              },
              {
                name: "Modern Condo",
                location: "Miami, FL",
                price: "$2,500/mo",
                type: "Rental",
                availability: "Immediate",
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500"
              },
              {
                name: "Commercial Space",
                location: "Los Angeles, CA",
                price: "$750,000",
                type: "Investment",
                return: "9.2%",
                image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500"
              }
            ].map((property, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={property.image} 
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-900/80 text-white">
                    {property.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1">{property.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{property.location}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">{property.price}</p>
                    {property.return && (
                      <p className="text-green-400">ROI: {property.return}</p>
                    )}
                    {property.availability && (
                      <p className="text-blue-400">{property.availability}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 