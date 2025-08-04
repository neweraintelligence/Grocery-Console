import React from 'react';
import { motion } from 'framer-motion';

interface AppShellProps {
  children: React.ReactNode;
}

const foodPuns = [
  "Lettuce celebrate fresh produce! 🥬",
  "Orange you glad it's grocery time? 🍊", 
  "This is nacho average shopping list! 🧀",
  "We're mint to be organized! 🌿",
  "Holy guacamole, let's get cooking! 🥑",
  "Olive this kitchen organization! 🫒"
];

const getRandomPun = () => {
  return foodPuns[Math.floor(Math.random() * foodPuns.length)];
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [punOfTheDay] = React.useState(getRandomPun());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <motion.header 
        className="relative bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                🍳
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-orange-200 to-pink-200 bg-clip-text text-transparent">
                  Mom's Grocery Dashboard
                </h1>
                <motion.p 
                  className="text-white/70 mt-1 text-sm font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {punOfTheDay}
                </motion.p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-2xl">
                <span className="animate-bounce delay-100">🥕</span>
                <span className="animate-bounce delay-200">🥬</span>
                <span className="animate-bounce delay-300">🍅</span>
                <span className="animate-bounce delay-500">🫐</span>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                + Quick Add
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative mt-20 py-8 text-center border-t border-white/10">
        <p className="text-white/50 text-sm font-medium">
          Made with 💚 for the best cook in the family
        </p>
      </footer>
    </div>
  );
};