import React from 'react';
import { Box, Container, Typography, Stack, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
          spacing={1}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: theme.palette.text.primary,
                letterSpacing: '-0.02em',
              }}
            >
              Nexora
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Context-aware personalized news.
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Nexora · React · Flask · MongoDB · AI
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;