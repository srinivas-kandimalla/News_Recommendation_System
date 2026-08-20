import React, { useState } from 'react';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  return (
    <Box>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={(theme) => ({
            padding: 0.5,
            border: `2px solid ${open ? theme.palette.primary.main : 'transparent'}`,
            transition: theme.transitions.create('border-color'),
          })}
        >
          <Avatar
            sx={(theme) => ({
              width: 36,
              height: 36,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 600,
            })}
          >
            {isAuthenticated ? <PersonIcon fontSize="small" /> : 'G'}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: (theme) => ({
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
              mt: 1.5,
              minWidth: 200,
              borderRadius: theme.shape.borderRadius * 2,
              border: `1px solid ${theme.palette.divider}`,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            }),
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isAuthenticated ? [
          <Box key="header" sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
              Account
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Logged in User
            </Typography>
          </Box>,
          <Divider key="div1" />,
          <MenuItem key="bookmarks" onClick={() => handleNavigate('/bookmarks')}>
            <ListItemIcon>
              <BookmarkIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Bookmarks" />
          </MenuItem>,
          <MenuItem key="analytics" onClick={() => handleNavigate('/analytics')}>
            <ListItemIcon>
              <BarChartIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </MenuItem>,
          <MenuItem key="admin" onClick={() => handleNavigate('/admin')}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Admin Dashboard" />
          </MenuItem>,
          <Divider key="div2" />,
          <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>,
        ] : [
          <MenuItem key="login" onClick={() => handleNavigate('/login')}>
            <ListItemIcon>
              <LoginIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Sign In" />
          </MenuItem>,
          <MenuItem key="register" onClick={() => handleNavigate('/register')}>
            <ListItemIcon>
              <PersonAddIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Register" />
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
};

export default ProfileMenu;
