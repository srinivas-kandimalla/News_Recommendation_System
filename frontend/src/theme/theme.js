import { createTheme } from '@mui/material/styles';
import { colors, darkColors } from './colors.js';
import typography from './typography.js';
import { shadows } from './shadows.js';

export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  const c = isDark ? darkColors : colors;

  return createTheme({
    palette: {
      mode,
      primary: c.primary,
      secondary: c.secondary,
      accent: c.accent,
      success: c.success,
      warning: c.warning,
      error: c.danger,
      background: {
        default: c.background.default,
        paper: c.background.paper,
      },
      divider: c.divider,
      text: c.text,
    },
    typography,
    shadows,
    shape: {
      borderRadius: 8, // Modern smooth radius
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': {
            boxSizing: 'border-box',
          },
          body: {
            backgroundColor: c.background.default,
            color: c.text.primary,
            scrollBehavior: 'smooth',
            fontFamily: '"Inter", "Outfit", "Plus Jakarta Sans", sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          'img, video': {
            maxWidth: '100%',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '8px 18px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            },
          },
          containedPrimary: {
            background: c.gradient?.primary || c.primary.main,
            color: '#FFFFFF',
            '&:hover': {
              background: isDark ? 'linear-gradient(135deg, #2563EB 0%, #6D28D9 100%)' : 'linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)',
            },
          },
          outlinedPrimary: {
            borderColor: c.primary.main,
            color: c.primary.main,
            borderWidth: 1.5,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)',
              borderWidth: 1.5,
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: c.background.paper,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${c.divider}`,
            borderRadius: 14,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.05), 0 6px 16px rgba(15,23,42,0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.3)',
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            borderRadius: 10,
            fontSize: '0.75rem',
            height: 28,
            transition: 'all 0.2s ease',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            border: `1px solid ${c.divider}`,
            borderRadius: 16,
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: c.divider,
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '& fieldset': {
                borderColor: c.divider,
              },
              '&:hover fieldset': {
                borderColor: c.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: c.primary.main,
                borderWidth: 2,
              },
            },
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            minWidth: 0,
            padding: '10px 18px',
            borderRadius: 8,
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: c.gradient?.primary || c.primary.main,
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(11, 15, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            color: c.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${c.divider}`,
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: c.background.paper,
            border: 'none',
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${c.divider}`,
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.875rem',
          },
        },
      },
    },
  });
};

const theme = createAppTheme('light');
export default theme;

