import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink, useNavigate } from 'react-router-dom';
import NexoraLogo from '../common/NexoraLogo';
import CloseIcon from '@mui/icons-material/Close';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

import HomeIcon from '@mui/icons-material/Explore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const MobileDrawer = ({ open, onClose, navLinks }) => {
  const theme = useTheme();
  const { toggleTheme, isDark } = useThemeMode();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNav = (to) => {
    onClose();
    navigate(to);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const getIcon = (to) => {
    switch (to) {
      case '/': return <HomeIcon sx={{ fontSize: 20 }} />;
      case '/recommendations': return <AutoAwesomeIcon sx={{ fontSize: 20, color: theme.palette.secondary.main }} />;
      case '/trending': return <TrendingUpIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />;
      case '/bookmarks': return <BookmarkIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />;
      case '/analytics': return <AnalyticsIcon sx={{ fontSize: 20 }} />;
      default: return <HomeIcon sx={{ fontSize: 20 }} />;
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          height: 64,
          flexShrink: 0,
        }}
      >
        <NexoraLogo size={28} fontSize="1.3rem" clickable={false} />
        <IconButton onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* User info if authenticated */}
      {isAuthenticated && user && (
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" color="text.primary" fontWeight={700}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      )}

      {/* Nav links */}
      <List sx={{ flex: 1, pt: 1.5 }}>
        {navLinks.map((link) => (
          <ListItem key={link.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNav(link.to)}
              sx={{
                px: 2.5,
                py: 1.25,
                borderRadius: '10px',
                mx: 1,
                display: 'flex',
                gap: 1.75,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(37, 99, 235, 0.06)',
                },
              }}
            >
              {getIcon(link.to)}
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Bottom actions */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <ListItemButton
          onClick={toggleTheme}
          sx={{
            px: 2.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {isDark ? <LightModeIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /> : <DarkModeIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />}
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
              color: theme.palette.text.secondary,
            }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Typography>
        </ListItemButton>

        {isAuthenticated ? (
          <ListItemButton
            onClick={handleLogout}
            sx={{ px: 2.5, py: 1.25 }}
          >
            <ListItemText
              primary="Sign out"
              primaryTypographyProps={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: '0.95rem',
                color: theme.palette.text.secondary,
              }}
            />
          </ListItemButton>
        ) : (
          <>
            <ListItemButton onClick={() => handleNav('/login')} sx={{ px: 2.5, py: 1.25 }}>
              <ListItemText
                primary="Sign in"
                primaryTypographyProps={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  color: theme.palette.text.secondary,
                }}
              />
            </ListItemButton>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;
