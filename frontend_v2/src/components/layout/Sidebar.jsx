import { AdminPanelSettingsOutlined, AnalyticsOutlined, AutoAwesomeOutlined, BookmarkBorderOutlined, HomeOutlined, LocalFireDepartmentOutlined, LoginOutlined, PersonOutlineRounded } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const primaryItems = [
  { label: 'Discover', path: '/', icon: HomeOutlined },
  { label: 'Trending now', path: '/trending', icon: LocalFireDepartmentOutlined },
];
const accountItems = [
  { label: 'For you', path: '/recommendations', icon: AutoAwesomeOutlined },
  { label: 'Bookmarks', path: '/bookmarks', icon: BookmarkBorderOutlined },
  { label: 'Reading insights', path: '/analytics', icon: AnalyticsOutlined },
  { label: 'My profile', path: '/profile', icon: PersonOutlineRounded },
  { label: 'Admin overview', path: '/admin', icon: AdminPanelSettingsOutlined },
];

function NavigationContent({ closeDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const renderItem = (item) => { const Icon = item.icon; const selected = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path); return <ListItemButton key={item.path} selected={selected} onClick={() => { navigate(item.path); closeDrawer?.(); }} sx={{ mx: 1, borderRadius: 2, mb: .4 }}><ListItemIcon sx={{ minWidth: 38 }}><Icon fontSize="small" /></ListItemIcon><ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 750 : 600, fontSize: 14 }} /></ListItemButton>; };
  return <Box sx={{ width: 248, height: '100%', display: 'flex', flexDirection: 'column', pt: { xs: 2, lg: 3 } }}><Box sx={{ px: 3, pb: 2 }}><Typography variant="overline" color="text.secondary" fontWeight={800}>Explore</Typography></Box><List disablePadding>{primaryItems.map(renderItem)}</List>{isAuthenticated && <><Divider sx={{ my: 2, mx: 2 }} /><Box sx={{ px: 3, pb: 1 }}><Typography variant="overline" color="text.secondary" fontWeight={800}>Your space</Typography></Box><List disablePadding>{accountItems.map(renderItem)}</List></>}<Box sx={{ mt: 'auto', p: 2.25 }}><Box sx={{ borderRadius: 2.5, bgcolor: 'primary.main', color: '#fff', p: 2 }}><Typography fontWeight={800} fontSize={14}>{isAuthenticated ? 'Your feed learns with you' : 'A sharper way to read'}</Typography><Typography variant="caption" sx={{ opacity: .85, display: 'block', mt: .5 }}>{isAuthenticated ? 'Read a few stories to unlock personal picks.' : 'Save stories and get recommendations tailored to you.'}</Typography>{!isAuthenticated && <Button variant="contained" color="inherit" startIcon={<LoginOutlined />} onClick={() => { navigate('/login'); closeDrawer?.(); }} sx={{ mt: 1.5, color: 'primary.main', bgcolor: '#fff', '&:hover': { bgcolor: '#eff6ff' } }}>Sign in</Button>}</Box></Box></Box>;
}

export default function Sidebar({ mobileOpen, onClose }) {
  return <><Box component="nav" sx={{ width: 248, flexShrink: 0, display: { xs: 'none', lg: 'block' }, borderRight: '1px solid', borderColor: 'divider', minHeight: 'calc(100vh - 69px)', position: 'sticky', top: 69, alignSelf: 'flex-start' }}><NavigationContent /></Box><Drawer open={mobileOpen} onClose={onClose} PaperProps={{ sx: { borderRadius: '0 18px 18px 0' } }} sx={{ display: { lg: 'none' } }}><NavigationContent closeDrawer={onClose} /></Drawer></>;
}
