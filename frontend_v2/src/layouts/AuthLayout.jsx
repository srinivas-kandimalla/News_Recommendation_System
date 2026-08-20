import { Box, Container, Typography, useTheme } from '@mui/material';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import ThemeToggle from '../components/common/ThemeToggle';

export default function AuthLayout() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left panel — editorial branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '44%',
          minHeight: '100vh',
          bgcolor: dark ? '#0D0D0F' : '#18181A',
          color: '#F0EEE8',
          p: { md: 5, lg: 7 },
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background accent */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,194,224,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand */}
        <Box>
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.07em',
              color: '#F0EEE8',
              display: 'inline-block',
              '& span': { color: '#00C2E0' },
            }}
          >
            nexora<span>.</span>
          </Typography>
        </Box>

        {/* Editorial tagline */}
        <Box>
          <Typography
            className="signal-headline"
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { md: '2.25rem', lg: '2.75rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#F0EEE8',
              mb: 2,
            }}
          >
            News, tuned to what matters.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'rgba(240,238,232,0.55)', lineHeight: 1.7, maxWidth: 340 }}
          >
            Nexora takes the noise of global news and tunes it to your interests — learning what matters to you with every story you read.
          </Typography>
        </Box>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: 'rgba(240,238,232,0.3)', letterSpacing: '0.08em' }}>
          NEXORA © {new Date().getFullYear()}
        </Typography>
      </Box>

      {/* Right panel — auth form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 3, md: 4 },
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Mobile brand */}
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.07em',
              color: 'text.primary',
              display: { md: 'none' },
              '& span': { color: 'primary.main' },
            }}
          >
            nexora<span>.</span>
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <ThemeToggle />
          </Box>
        </Box>

        {/* Form area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 4, md: 6 },
            px: { xs: 3, sm: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
