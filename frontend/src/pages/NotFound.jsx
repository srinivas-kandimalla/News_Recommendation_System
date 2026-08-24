import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 800,
          fontSize: { xs: '4rem', md: '6rem' },
          color: theme.palette.divider,
          lineHeight: 1,
          mb: 1,
        }}
      >
        404
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          color: theme.palette.text.primary,
          mb: 1,
        }}
      >
        Page not found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Box
        onClick={() => navigate('/')}
        sx={{
          display: 'inline-block',
          px: 3,
          py: 1.25,
          border: `1px solid ${theme.palette.text.primary}`,
          borderRadius: 1,
          cursor: 'pointer',
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: theme.palette.text.primary,
          '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
        }}
      >
        Back to home
      </Box>
    </Box>
  );
}

export default NotFound;