import React from 'react';
import { useChit } from '../context/ChitContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, language } = useChit();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`btn-theme-toggle ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggleTheme}
      title={isDark 
        ? (language === 'te' ? 'లైట్ థీమ్‌కు మారండి' : 'Switch to Light Theme') 
        : (language === 'te' ? 'డార్క్ థీమ్‌కు మారండి' : 'Switch to Dark Theme')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun size={17} className="theme-toggle-icon sun" />
      ) : (
        <Moon size={17} className="theme-toggle-icon moon" />
      )}
    </button>
  );
};

