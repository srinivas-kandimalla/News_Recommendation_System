import {
  BottomNavigation, BottomNavigationAction, Paper,
} from '@mui/material';
import {
  HomeRounded, LocalFireDepartmentRounded,
  BookmarkBorderRounded, PersonOutlineRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [
  { label: 'Home', path: '/', icon: HomeRounded },
  { label: 'Trending', path: '/trending', icon: LocalFireDepartmentRounded },
  { label: 'Saved', path: '/bookmarks', icon: BookmarkBorderRounded, authRequired: true },
  { label: 'Profile', path: '/profile', icon: PersonOutlineRounded, authRequired: true },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Only show on mobile
  const currentPath = location.pathname;
  const value = ITEMS.findIndex((item) =>
    item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
  );

  return (
    <Paper
      component="nav"
      aria-label="Mobile navigation"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: 1300,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        sx={{ bgcolor: 'background.paper', height: 56 }}
      >
        {ITEMS.map(({ label, path, icon: Icon, authRequired }) => {
          const hidden = authRequired && !isAuthenticated;
          if (hidden && (label === 'Saved' || label === 'Profile')) {
            // Show login shortcut instead
          }
          return (
            <BottomNavigationAction
              key={path}
              label={label}
              icon={<Icon sx={{ fontSize: 22 }} />}
              onClick={() => {
                if (authRequired && !isAuthenticated) {
                  navigate('/login');
                } else {
                  navigate(path);
                }
              }}
              sx={{
                minWidth: 0,
                fontSize: '0.65rem',
                '&.Mui-selected': { color: 'primary.main' },
                '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', mt: 0.25 },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
