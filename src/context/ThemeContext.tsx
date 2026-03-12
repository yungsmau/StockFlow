import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  textPrimary: '#000000',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  borderColor: 'rgba(0, 0, 0, 0.25)'
};

const darkColors: ThemeColors = {
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2d2d2d',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  borderColor: 'rgba(255, 255, 255, 0.3)'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialTheme = (window as any).INITIAL_THEME || 'light';
  const [theme, setTheme] = useState<Theme>(initialTheme as Theme);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};