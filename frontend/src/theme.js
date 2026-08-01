import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a", // Deep Slate
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#991b1b", // Editorial Crimson
      contrastText: "#ffffff",
    },
    info: {
      main: "#0d9488", // AI Accent Teal
      contrastText: "#ffffff",
    },
    success: {
      main: "#15803d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#b45309",
      contrastText: "#ffffff",
    },
    error: {
      main: "#991b1b", // Editorial Crimson for errors/critical highlights
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc", // Soft Slate-tinted Off-White
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
  },

  typography: {
    fontFamily: ["'Inter'", "system-ui", "-apple-system", "sans-serif"].join(","),

    h1: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },
    h2: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },
    h3: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },
    h4: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },
    h5: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },
    h6: { fontFamily: "'Merriweather', Georgia, serif", fontWeight: 700 },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;