import React, { useState } from 'react';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Tooltip,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CompassIcon from '@mui/icons-material/ExploreOutlined';

import { useAuth } from '../../context/AuthContext';

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const go = (path) => { handleClose(); navigate(path); };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'N';

  const menuItemSx = {
    fontFamily: '"Inter", sans-serif',
    fontSize: '0.875rem',
    py: 1.2,
    px: 2.5,
    borderRadius: '8px',
    mx: 1,
    my: 0.2,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(59, 130, 246, 0.12)'
        : 'rgba(37, 99, 235, 0.06)',
    },
  };

  return (
    <>
      <Tooltip title={isAuthenticated ? (user?.name || 'Account') : 'Sign in'}>
        <IconButton onClick={handleOpen} sx={{ p: 0.5 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 800,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 10px rgba(56, 189, 248, 0.35)'
                : '0 2px 10px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 14px rgba(56, 189, 248, 0.5)'
                  : '0 4px 14px rgba(37, 99, 235, 0.5)',
              },
            }}
          >
            {isAuthenticated ? initial : 'N'}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1.5,
              minWidth: 230,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 30px rgba(0,0,0,0.5)'
                : '0 10px 30px rgba(37,99,235,0.08)',
              p: 0.5,
            },
          },
        }}
      >
        {isAuthenticated ? [
          <Box key="header" sx={{ px: 2.5, py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography
                sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: theme.palette.text.primary }}
              >
                {user?.name || 'Reader'}
              </Typography>
              <Chip
                label={user?.role === 'admin' ? 'Admin' : 'Member'}
                size="small"
                color={user?.role === 'admin' ? 'secondary' : 'primary'}
                sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, borderRadius: '6px' }}
              />
            </Box>
            {user?.email && (
              <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.78rem', color: theme.palette.text.secondary }} noWrap>
                {user.email}
              </Typography>
            )}
          </Box>,
          <Divider key="d1" sx={{ my: 0.5 }} />,
          <MenuItem key="analytics" onClick={() => go('/analytics')} sx={menuItemSx}>
            <ListItemIcon><BarChartIcon fontSize="small" color="primary" /></ListItemIcon>
            Reading Analytics & Telemetry
          </MenuItem>,
          ...(user?.role === 'admin' ? [
            <MenuItem key="admin" onClick={() => go('/admin')} sx={menuItemSx}>
              <ListItemIcon><AdminPanelSettingsIcon fontSize="small" color="secondary" /></ListItemIcon>
              Admin Portal
            </MenuItem>
          ] : []),
          <Divider key="d2" sx={{ my: 0.5 }} />,
          <MenuItem
            key="logout"
            onClick={handleLogout}
            sx={{ ...menuItemSx, color: theme.palette.error.main }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            Sign out
          </MenuItem>,
        ] : [
          <MenuItem key="login" onClick={() => go('/login')} sx={menuItemSx}>
            <ListItemIcon><LoginIcon fontSize="small" color="primary" /></ListItemIcon>
            Sign in
          </MenuItem>,
          <MenuItem key="register" onClick={() => go('/register')} sx={menuItemSx}>
            <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
            Create account
          </MenuItem>,
        ]}
      </Menu>
    </>
  );
};

export default ProfileMenu;
