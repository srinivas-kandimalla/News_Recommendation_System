import { Box } from '@mui/material';

/**
 * SignalEdge — recommendation strength visualizer.
 * Desktop/tablet: 3px vertical left bar, fill height = score (0–1)
 * Mobile: 3px top horizontal bar, fill width = score
 * score: 0 to 1
 */
export default function SignalEdge({ score = 0 }) {
  const clampedScore = Math.min(1, Math.max(0, score || 0));
  // Map score to visual fill: min 18%, max 100%
  const fillPct = Math.round(18 + clampedScore * 82);

  return (
    <>
      {/* Desktop: vertical left bar */}
      <Box
        aria-hidden="true"
        sx={{
          display: { xs: 'none', sm: 'block' },
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '3px',
          height: '100%',
          bgcolor: 'divider',
          borderRadius: '0 0 0 12px',
          overflow: 'hidden',
        }}
      >
        <Box
          className="signal-edge-fill"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${fillPct}%`,
            bgcolor: 'primary.main',
            borderRadius: 'inherit',
            transition: 'height 220ms ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Box>

      {/* Mobile: horizontal top bar */}
      <Box
        aria-hidden="true"
        sx={{
          display: { xs: 'block', sm: 'none' },
          position: 'absolute',
          top: 0,
          left: 0,
          height: '3px',
          width: '100%',
          bgcolor: 'divider',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${fillPct}%`,
            bgcolor: 'primary.main',
            transition: 'width 220ms ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Box>
    </>
  );
}
