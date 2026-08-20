import { Avatar, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { AccountCircleOutlined, AdminPanelSettingsOutlined, LogoutRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/formatters';

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setAnchorEl(null);

  const isAdmin = user?.role === 'admin';

  const signOut = () => {
    close();
    logout();
    navigate('/');
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          aria-label="Open account menu"
          sx={{ p: 0.25 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials(user?.name)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              mt: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important', py: 1.25, px: 2 }}>
          <div>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user?.name || 'Reader'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </div>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { close(); navigate('/profile'); }}>
          <ListItemIcon><AccountCircleOutlined fontSize="small" /></ListItemIcon>
          My profile
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => { close(); navigate('/admin'); }}>
            <ListItemIcon><AdminPanelSettingsOutlined fontSize="small" /></ListItemIcon>
            Admin dashboard
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={signOut} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutRounded fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
