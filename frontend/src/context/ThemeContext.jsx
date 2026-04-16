import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'base'); // base, large, x-large
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('reducedMotion') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    // Theme
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Accessibility Classes
    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    
    if (reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
    
    root.setAttribute('data-font-size', fontSize);

    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('highContrast', highContrast);
    localStorage.setItem('reducedMotion', reducedMotion);
  }, [theme, fontSize, highContrast, reducedMotion]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleContrast = () => setHighContrast(prev => !prev);
  const toggleMotion = () => setReducedMotion(prev => !prev);

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, 
      fontSize, setFontSize, 
      highContrast, toggleContrast,
      reducedMotion, toggleMotion 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
