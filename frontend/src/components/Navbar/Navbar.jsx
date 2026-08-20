import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HomeIcon from '@mui/icons-material/Home';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';

import { StyledAppBar, StyledToolbar } from './navbar.styles';
import NavItem from './NavItem';
import SearchInput from './SearchInput';
import ProfileMenu from './ProfileMenu';
import MobileDrawer from './MobileDrawer';

const navItems = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'Trending', path: '/trending', icon: TrendingUpIcon },
  { label: 'AI For You', path: '/recommendations', icon: AutoAwesomeIcon },
  { label: 'Bookmarks', path: '/bookmarks', icon: BookmarkIcon },
  { label: 'Analytics', path: '/analytics', icon: BarChartIcon },
];

const categories = [
  'Technology',
  'Business',
  'World',
  'Sports',
  'Entertainment',
  'Health',
  'Science',
];

const Navbar = ({ onSearch, darkMode = false, onToggleTheme }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryAnchor, setCategoryAnchor] = useState(null);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleSearchSubmit = (query) => {
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleCategoryOpen = (event) => {
    setCategoryAnchor(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchor(null);
  };

  const handleCategorySelect = (category) => {
    handleCategoryClose();
    navigate(`/?category=${encodeURIComponent(category)}`);
  };

  return (
    <StyledAppBar>
      <StyledToolbar>
        {/* Brand Logo & Title */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            cursor: 'pointer',
            mr: 3,
          }}
        >
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: `${theme.shape.borderRadius * 1.5}px`,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: '#FFFFFF',
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
            })}
          >
            <NewspaperIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={(theme) => ({
              fontFamily: theme.typography.h6.fontFamily,
              fontWeight: 800,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              display: { xs: 'none', sm: 'block' },
            })}
          >
            NewsPulse
          </Typography>
        </Box>

        {/* Desktop Nav Items */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {navItems.slice(0, 3).map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}

          {/* Categories Dropdown Button */}
          <Button
            onClick={handleCategoryOpen}
            endIcon={<KeyboardArrowDownIcon />}
            sx={(theme) => ({
              fontFamily: theme.typography.button.fontFamily,
              fontWeight: 500,
              fontSize: theme.typography.button.fontSize,
              color: theme.palette.text.secondary,
              borderRadius: theme.shape.borderRadius * 2,
              padding: theme.spacing(1, 1.5),
              textTransform: 'none',
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: `${theme.palette.primary.main}15`,
              },
            })}
          >
            Categories
          </Button>

          <Menu
            anchorEl={categoryAnchor}
            open={Boolean(categoryAnchor)}
            onClose={handleCategoryClose}
            slotProps={{
              paper: {
                elevation: 3,
                sx: (theme) => ({
                  mt: 1,
                  borderRadius: theme.shape.borderRadius * 2,
                  minWidth: 160,
                }),
              },
            }}
          >
            {categories.map((cat) => (
              <MenuItem
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                sx={{ fontSize: '0.875rem', fontWeight: 500 }}
              >
                {cat}
              </MenuItem>
            ))}
          </Menu>

          {navItems.slice(3).map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Search Bar */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
          />
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          {/* Notifications Icon Button */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              })}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Theme Toggle Placeholder */}
          <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              onClick={onToggleTheme}
              color="inherit"
              aria-label="toggle theme"
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              })}
            >
              {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* User Profile Menu */}
          <ProfileMenu />

          {/* Mobile Drawer Trigger */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{
              display: { md: 'none' },
              ml: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </StyledToolbar>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={handleDrawerToggle}
        navItems={navItems}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
      />
    </StyledAppBar>
  );
};

export default Navbar;
