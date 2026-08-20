import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../theme/createAppTheme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'pulse-theme-mode';

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((previous) => {
      const next = previous === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleTheme }), [mode]);
  return <ThemeContext.Provider value={value}><ThemeProvider theme={theme}>{children}</ThemeProvider></ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
}
