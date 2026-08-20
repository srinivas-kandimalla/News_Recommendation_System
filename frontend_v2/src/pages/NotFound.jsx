import { HomeRounded } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found'); return <Container maxWidth="sm"><Box sx={{ py: { xs: 12, md: 18 }, textAlign: 'center' }}><Typography variant="h1" color="primary" sx={{ fontSize: 'clamp(5rem, 18vw, 10rem)' }}>404</Typography><Typography variant="h4">This page slipped past the feed</Typography><Typography color="text.secondary" sx={{ mt: 1.5 }}>The story you were looking for may have moved or no longer exists.</Typography><Button component={RouterLink} to="/" variant="contained" startIcon={<HomeRounded />} sx={{ mt: 3 }}>Return home</Button></Box></Container>;
}
