import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 md:bottom-auto md:right-6 md:top-6 z-[100] p-3 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-2xl group"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 transform transition-transform duration-500 rotate-0 scale-100" />
        ) : (
          <Moon className="w-6 h-6 transform transition-transform duration-500 rotate-0 scale-100" />
        )}
      </div>
      <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default ThemeToggle;
