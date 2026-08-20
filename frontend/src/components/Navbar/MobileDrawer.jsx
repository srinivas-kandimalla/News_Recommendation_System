import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchInput from './SearchInput';

const MobileDrawer = ({ open, onClose, navItems, searchValue, onSearchChange }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const getIcon = (path) => {
    switch (path) {
      case '/':
        return <HomeIcon />;
      case '/trending':
        return <TrendingUpIcon />;
      case '/recommendations':
        return <AutoAwesomeIcon />;
      case '/bookmarks':
        return <BookmarkIcon />;
      case '/analytics':
        return <BarChartIcon />;
      case '/admin':
        return <AdminPanelSettingsIcon />;
      default:
        return <HomeIcon />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: 280,
            backgroundColor: theme.palette.background.paper,
            backdropFilter: 'blur(16px)',
            p: 2,
          }),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" color="primary" fontWeight={700}>
          News Pulse
        </Typography>
        <IconButton onClick={onClose} aria-label="close drawer">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search..."
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <RouterNavLink
              to={item.path}
              style={{ textDecoration: 'none', width: '100%' }}
              onClick={onClose}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={(theme) => ({
                    borderRadius: theme.shape.borderRadius,
                    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemIcon
                    sx={(theme) => ({
                      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                      minWidth: 40,
                    })}
                  >
                    {getIcon(item.path)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              )}
            </RouterNavLink>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 'auto' }}>
        {isAuthenticated ? (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        ) : (
          <ListItem disablePadding>
            <RouterNavLink
              to="/login"
              style={{ textDecoration: 'none', width: '100%' }}
              onClick={onClose}
            >
              <ListItemButton sx={{ borderRadius: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LoginIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Sign In" color="primary" />
              </ListItemButton>
            </RouterNavLink>
          </ListItem>
        )}
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;
