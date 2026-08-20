import { MenuRounded, SearchRounded } from '@mui/icons-material';
import { AppBar, Box, Button, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../common/SearchBar';
import ThemeToggle from '../common/ThemeToggle';
import ProfileMenu from './ProfileMenu';

export default function Navbar({ onMenuOpen }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') || '');

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.search]);

  const submitSearch = (value) => {
    const term = value.trim();
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/');
  };

  const openMobileSearch = () => {
    navigate('/?focusSearch=1');
  };

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.background.default + 'ed', backdropFilter: 'blur(14px)' }}>
      <Toolbar sx={{ minHeight: '68px !important', gap: 1.25 }}>
        <IconButton onClick={onMenuOpen} aria-label="Open navigation" sx={{ display: { lg: 'none' } }}><MenuRounded /></IconButton>
        <Typography component={RouterLink} to="/" variant="h5" fontWeight={850} sx={{ letterSpacing: '-.06em', color: 'text.primary', mr: { xs: 'auto', md: 1 } }}>pulse<Box component="span" sx={{ color: 'primary.main' }}>.</Box></Typography>
        <Box sx={{ width: 340, maxWidth: '36vw', display: { xs: 'none', md: 'block' }, mr: 'auto' }}>
          <SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} fullWidth placeholder="Search stories, authors, topics…" />
        </Box>
        <Tooltip title="Search stories"><IconButton onClick={openMobileSearch} color={location.pathname === '/' ? 'primary' : 'default'} sx={{ display: { md: 'none' } }}><SearchRounded /></IconButton></Tooltip>
        <ThemeToggle />
        {isAuthenticated ? <ProfileMenu /> : <Stack direction="row" spacing={1}><Button component={RouterLink} to="/login" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Sign in</Button><Button component={RouterLink} to="/register" variant="contained">Join Pulse</Button></Stack>}
      </Toolbar>
    </AppBar>
  );
}
