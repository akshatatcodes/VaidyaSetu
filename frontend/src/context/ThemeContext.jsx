import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Pure light mode per hackathon requirements
  const theme = 'light';
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'base');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('reducedMotion') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    // Permanent light mode: guarantee dark class is removed
    root.classList.remove('dark');
    
    // Accessibility Classes
    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    
    if (reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
    
    root.setAttribute('data-font-size', fontSize);

    localStorage.setItem('theme', 'light');
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('highContrast', highContrast);
    localStorage.setItem('reducedMotion', reducedMotion);
  }, [fontSize, highContrast, reducedMotion]);

  const toggleTheme = () => {}; // No-op, light mode only
  const toggleContrast = () => setHighContrast(prev => !prev);
  const toggleMotion = () => setReducedMotion(prev => !prev);

  return (
    <ThemeContext.Provider value={{ 
      theme: 'light', toggleTheme, 
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
