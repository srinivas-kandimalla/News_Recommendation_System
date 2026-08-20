import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useAppTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useAppTheme();
  const label = mode === 'light' ? 'Use dark theme' : 'Use light theme';
  return <Tooltip title={label}><IconButton aria-label={label} onClick={toggleTheme} color="inherit">{mode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}</IconButton></Tooltip>;
}
