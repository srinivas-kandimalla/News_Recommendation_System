import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  InputBase,
  Typography,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CloseIcon from '@mui/icons-material/Close';

import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import MobileDrawer from './MobileDrawer';
import NexoraLogo from '../common/NexoraLogo';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'For You', to: '/recommendations' },
  { label: 'Trending', to: '/trending' },
  { label: 'Bookmarks', to: '/bookmarks' },
];

const Navbar = () => {
  const theme = useTheme();
  const { toggleTheme, isDark } = useThemeMode();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
    }
  };

  const navLinkSx = ({ isActive }) => ({
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.92rem',
    color: isActive ? (isDark ? '#60A5FA' : '#2563EB') : theme.palette.text.secondary,
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '10px',
    backgroundColor: isActive
      ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)')
      : 'transparent',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          height: 64,
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1280,
            width: '100%',
            mx: 'auto',
            px: { xs: 2, md: 3 },
            minHeight: '64px !important',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ mr: 1, color: theme.palette.text.primary }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo: Custom Signature Nexora Logo Emblem + Wordmark */}
          <Box sx={{ mr: { xs: 'auto', md: 4 } }}>
            <NexoraLogo size={32} fontSize="1.45rem" />
          </Box>

          {/* Desktop nav links */}
          {!isMobile && !searchOpen && (
            <Box
              component="nav"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                flex: 1,
              }}
            >
              {NAV_LINKS.map((link) => (
                <Box
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  style={navLinkSx}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {link.label}
                </Box>
              ))}
            </Box>
          )}

          {/* Spacer on desktop when search closed */}
          {!isMobile && !searchOpen && <Box sx={{ flex: 1 }} />}

          {/* Inline search bar (desktop) */}
          {!isMobile && searchOpen && (
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                mx: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                px: 1.5,
                height: 36,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <SearchIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
              <InputBase
                autoFocus
                fullWidth
                placeholder="Search articles, topics, sources..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                sx={{
                  fontSize: '0.875rem',
                  fontFamily: '"Inter", sans-serif',
                  color: theme.palette.text.primary,
                }}
              />
              <IconButton size="small" onClick={() => { setSearchOpen(false); setSearchValue(''); }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { xs: 0, md: 1 } }}>
            {/* Search toggle */}
            {!searchOpen && (
              <Tooltip title="Search (Ctrl+K)">
                <IconButton
                  onClick={() => setSearchOpen(true)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <SearchIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Theme toggle */}
            <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{ color: theme.palette.text.secondary }}
              >
                {isDark
                  ? <LightModeIcon sx={{ fontSize: 20 }} />
                  : <DarkModeIcon sx={{ fontSize: 20 }} />
                }
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <ProfileMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navLinks={NAV_LINKS}
      />
    </>
  );
};

export default Navbar;
