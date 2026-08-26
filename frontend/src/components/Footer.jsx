import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NexoraLogo from './common/NexoraLogo';

function Footer() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <NexoraLogo size={24} fontSize="1.15rem" />

          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            © {new Date().getFullYear()} Nexora · Context-Aware AI News Engine
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;