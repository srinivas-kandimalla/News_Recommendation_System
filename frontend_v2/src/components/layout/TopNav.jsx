import { useEffect, useRef, useState } from 'react';
import {
  AppBar, Box, Button, Container, IconButton,
  InputAdornment, TextField, Toolbar, Typography, Tooltip,
} from '@mui/material';
import { CloseRounded, SearchRounded } from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import ProfileMenu from './ProfileMenu';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Trending', path: '/trending' },
];

export default function TopNav() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/');
    setSearchOpen(false);
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1200,
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{
            minHeight: '60px !important',
            px: { xs: 2, sm: 3, md: 4 },
            gap: 1,
          }}
        >
          {/* Brand */}
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.25rem', md: '1.4rem' },
              letterSpacing: '-0.07em',
              color: 'text.primary',
              mr: { xs: 'auto', md: 2 },
              flexShrink: 0,
              lineHeight: 1,
              '& span': { color: 'primary.main' },
            }}
          >
            nexora<span>.</span>
          </Typography>

          {/* Desktop nav links */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              mr: 'auto',
            }}
          >
            {NAV_LINKS.map(({ label, path }) => (
              <Button
                key={path}
                component={RouterLink}
                to={path}
                color={isActive(path) ? 'primary' : 'inherit'}
                sx={{
                  fontWeight: isActive(path) ? 700 : 500,
                  fontSize: '0.875rem',
                  opacity: isActive(path) ? 1 : 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

          {/* Desktop search */}
          {searchOpen ? (
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                width: 280,
              }}
            >
              <TextField
                inputRef={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                size="small"
                placeholder="Search stories…"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" sx={{ opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => { setSearchOpen(false); setQuery(''); }}
                        aria-label="Close search"
                      >
                        <CloseRounded fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          ) : (
            <Tooltip title="Search">
              <IconButton
                color="inherit"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                sx={{ display: { xs: 'none', md: 'flex' } }}
              >
                <SearchRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Mobile search icon */}
          <Tooltip title="Search">
            <IconButton
              color="inherit"
              aria-label="Search"
              onClick={() => navigate('/?focusSearch=1')}
              sx={{ display: { md: 'none' } }}
            >
              <SearchRounded fontSize="small" />
            </IconButton>
          </Tooltip>

          <ThemeToggle />

          {isAuthenticated ? (
            <ProfileMenu />
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                size="small"
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, opacity: 0.7 }}
              >
                Sign in
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
                sx={{ borderRadius: 6, px: 2 }}
              >
                Join Nexora
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
