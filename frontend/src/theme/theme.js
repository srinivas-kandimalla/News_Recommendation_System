import { createTheme } from '@mui/material/styles';
import colors from './colors.js';
import typography from './typography.js';
import shadows from './shadows.js';

const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.danger,
    danger: colors.danger,
    background: colors.background,
    surface: colors.surface,
    border: colors.border,
    text: colors.text,
  },
  typography,
  shadows,
  shape: {
    borderRadius: 8,
  },
});

export default theme;
