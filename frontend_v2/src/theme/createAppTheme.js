import { alpha, createTheme } from '@mui/material/styles';

// Signal Design Tokens
export const tokens = {
  // Accent — electric cyan
  cyan: '#00C2E0',
  cyanDark: '#008FAA',
  cyanLight: '#33CFEA',

  // Dark theme
  dark: {
    bg: '#121214',
    surface: '#1B1B1F',
    elevated: '#232328',
    border: 'rgba(255,255,255,0.07)',
    text: '#F0EEE8',
    textSecondary: '#9E9B94',
    textTertiary: '#6B6863',
  },

  // Light theme
  light: {
    bg: '#F7F4EF',
    surface: '#FFFFFF',
    elevated: '#F0EDE7',
    border: 'rgba(0,0,0,0.08)',
    text: '#18181A',
    textSecondary: '#5C5954',
    textTertiary: '#9E9B94',
  },
};

export function createAppTheme(mode) {
  const dark = mode === 'dark';
  const t = dark ? tokens.dark : tokens.light;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.cyan,
        dark: tokens.cyanDark,
        light: tokens.cyanLight,
        contrastText: dark ? '#121214' : '#121214',
      },
      secondary: {
        main: dark ? '#7C6F5E' : '#8B7355',
        contrastText: '#fff',
      },
      success: { main: '#22C55E' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      info: { main: tokens.cyan },
      background: {
        default: t.bg,
        paper: t.surface,
      },
      text: {
        primary: t.text,
        secondary: t.textSecondary,
        disabled: t.textTertiary,
      },
      divider: t.border,
      action: {
        hover: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        selected: dark ? 'rgba(0,194,224,0.10)' : 'rgba(0,143,170,0.08)',
        focus: dark ? 'rgba(0,194,224,0.15)' : 'rgba(0,143,170,0.12)',
      },
    },

    typography: {
      fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        letterSpacing: '-0.04em',
        lineHeight: 1.15,
      },
      h2: { fontWeight: 750, letterSpacing: '-0.03em', lineHeight: 1.2 },
      h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25 },
      h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
      h5: { fontWeight: 650, letterSpacing: '-0.015em', lineHeight: 1.35 },
      h6: { fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.4 },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.6 },
      caption: { letterSpacing: '0.02em' },
      overline: { letterSpacing: '0.12em', fontWeight: 700, fontSize: '0.7rem' },
      button: { fontWeight: 700, textTransform: 'none', letterSpacing: '-0.005em' },
    },

    shape: { borderRadius: 12 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.bg,
            scrollbarWidth: 'thin',
            scrollbarColor: dark ? '#3A3A40 transparent' : '#D4CFC7 transparent',
          },
          '::selection': {
            background: alpha(tokens.cyan, 0.25),
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingInline: 18,
            paddingBlock: 8,
            fontSize: '0.875rem',
            transition: 'all 160ms ease',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none', filter: 'brightness(1.1)' },
          },
          outlined: {
            borderColor: t.border,
            '&:hover': { borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
          },
          text: {
            '&:hover': { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${t.border}`,
            backgroundColor: t.surface,
            borderRadius: 12,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.border },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.cyan,
              borderWidth: 1.5,
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { '&.Mui-focused': { color: tokens.cyan } },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.01em',
            borderRadius: 6,
          },
          filledPrimary: {
            backgroundColor: alpha(tokens.cyan, dark ? 0.18 : 0.12),
            color: dark ? tokens.cyanLight : tokens.cyanDark,
            '&:hover': { backgroundColor: alpha(tokens.cyan, dark ? 0.25 : 0.18) },
          },
          outlinedPrimary: {
            borderColor: alpha(tokens.cyan, 0.4),
            color: dark ? tokens.cyanLight : tokens.cyanDark,
          },
        },
      },

      MuiDivider: {
        styleOverrides: { root: { borderColor: t.border } },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: alpha(t.bg, 0.85),
            borderBottom: `1px solid ${t.border}`,
            boxShadow: 'none',
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background 140ms ease',
            '&.Mui-selected': {
              backgroundColor: alpha(tokens.cyan, dark ? 0.12 : 0.08),
              color: dark ? tokens.cyanLight : tokens.cyanDark,
              '&:hover': { backgroundColor: alpha(tokens.cyan, dark ? 0.16 : 0.12) },
              '& .MuiListItemIcon-root': { color: dark ? tokens.cyanLight : tokens.cyanDark },
            },
          },
        },
      },

      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: 6,
            backgroundColor: dark ? '#3A3A40' : '#18181A',
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 99 },
          bar: { borderRadius: 99 },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background 140ms ease, transform 140ms ease',
            '&:hover': { transform: 'scale(1.05)' },
            '&:active': { transform: 'scale(0.97)' },
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8, fontSize: '0.875rem' },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: t.textSecondary,
              borderBottom: `1px solid ${t.border}`,
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${t.border}` },
        },
      },
    },
  });
}
