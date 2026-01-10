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
    <div className="min-h-screen bg-slate-950 selection:bg-emerald-500/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-500"></div>
      </div>

      <motion.header 
        className="relative bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 shadow-2xl sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[85rem] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/10"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                🍳
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-orange-100 to-pink-100 bg-clip-text text-transparent font-['Fredoka']">
                  Grocery Dashboard
                </h1>
                <motion.p 
                  className="text-white/40 mt-0.5 text-sm font-medium tracking-wide flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {punOfTheDay}
                </motion.p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-2xl bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <span className="animate-bounce delay-100 hover:scale-120 transition-transform cursor-default">🥕</span>
                <span className="animate-bounce delay-200 hover:scale-120 transition-transform cursor-default">🥬</span>
                <span className="animate-bounce delay-300 hover:scale-120 transition-transform cursor-default">🍅</span>
                <span className="animate-bounce delay-500 hover:scale-120 transition-transform cursor-default">🫐</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <motion.button 
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 border border-emerald-400/20 flex items-center gap-2"
                whileHover={{ scale: 1.02, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>➕</span> Quick Add
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative max-w-[85rem] mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative mt-20 py-12 text-center border-t border-white/5 bg-slate-900/20">
        <p className="text-white/30 text-sm font-semibold tracking-widest uppercase">
          Crafted with <span className="text-emerald-500 animate-pulse">💚</span> for Laurie
        </p>
      </footer>
    </div>
  );
};