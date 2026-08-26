import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';

/**
 * The Nexora Infinity Prism Monogram
 * A continuous 3D geometric vector emblem representing converging AI news intelligence.
 */
export const NexoraIcon = ({ size = 32 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        {/* Facet 1: Left Vertical Stem Gradient */}
        <linearGradient id="nexoraFacet1" x1="4" y1="32" x2="14" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor={isDark ? '#1E293B' : '#0F172A'} />
          <stop offset="1" stopColor={isDark ? '#38BDF8' : '#2563EB'} />
        </linearGradient>

        {/* Facet 2: Center Diagonal Cross Bridge Gradient */}
        <linearGradient id="nexoraFacet2" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor={isDark ? '#38BDF8' : '#2563EB'} />
          <stop offset="0.6" stopColor={isDark ? '#818CF8' : '#4F46E5'} />
          <stop offset="1" stopColor={isDark ? '#C4B5FD' : '#7C3AED'} />
        </linearGradient>

        {/* Facet 3: Right Vertical Pillar Gradient */}
        <linearGradient id="nexoraFacet3" x1="22" y1="32" x2="32" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor={isDark ? '#6366F1' : '#1E293B'} />
          <stop offset="1" stopColor={isDark ? '#38BDF8' : '#2563EB'} />
        </linearGradient>
      </defs>

      {/* Modern 3D Infinity Monogram Paths */}
      {/* Left Pillar */}
      <rect x="5" y="6" width="6.5" height="24" rx="3.25" fill="url(#nexoraFacet1)" />

      {/* Right Pillar */}
      <rect x="24.5" y="6" width="6.5" height="24" rx="3.25" fill="url(#nexoraFacet3)" />

      {/* Interlocking Dynamic Cross Bridge */}
      <path
        d="M6 7.5C6 6.11929 7.11929 5 8.5 5H10.5C11.4 5 12.2 5.5 12.6 6.3L27.5 29.7C28.2 30.8 29.6 31.2 30.7 30.5C31.2 30.2 31.5 29.7 31.5 29.1V27.5L10 6"
        fill="url(#nexoraFacet2)"
      />

      {/* Luminous Apex Focal Node */}
      <circle cx="27.75" cy="9.25" r="2.25" fill={isDark ? '#38BDF8' : '#2563EB'} />
    </svg>
  );
};

/**
 * Masterpiece Nexora Executive Brand Wordmark Component
 */
const NexoraLogo = ({
  size = 32,
  fontSize = '1.45rem',
  showText = true,
  to = '/',
  clickable = true,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        textDecoration: 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <NexoraIcon size={size} />

      {showText && (
        <Typography
          component="span"
          sx={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: fontSize,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Box component="span" sx={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            Nex
          </Box>
          <Box
            component="span"
            sx={{
              color: isDark ? '#38BDF8' : '#2563EB',
              ml: '0.5px',
            }}
          >
            ora
          </Box>
        </Typography>
      )}
    </Box>
  );

  if (clickable && to) {
    return (
      <Box
        component={NavLink}
        to={to}
        sx={{
          textDecoration: 'none',
          display: 'inline-flex',
          transition: 'opacity 0.2s ease',
          '&:hover': {
            opacity: 0.88,
          },
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default NexoraLogo;
