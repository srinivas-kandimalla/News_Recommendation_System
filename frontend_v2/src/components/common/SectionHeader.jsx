import { Box, Typography } from '@mui/material';

/**
 * SectionHeader — Signal section divider with eyebrow label and title.
 * Replaces generic PageHeader for section-level use.
 */
export default function SectionHeader({ eyebrow, title, description, action, sx = {} }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        ...sx,
      }}
    >
      <Box>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.12em',
              display: 'block',
              mb: 0.5,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.025em' }}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, maxWidth: 560, lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
