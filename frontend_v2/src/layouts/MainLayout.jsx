import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/layout/TopNav';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Footer from '../components/layout/Footer';

export default function MainLayout() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <Box
      id="top"
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      className={isAuthenticated ? 'signal-bottom-nav-offset' : ''}
    >
      <TopNav onMobileSearchOpen={() => setMobileSearchOpen(true)} />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flex: 1,
          py: { xs: 3, md: 5 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Outlet />
        <Footer />
      </Container>
      <MobileBottomNav />
    </Box>
  );
}
