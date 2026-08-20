import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 10,
        pt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        pb: 1,
      }}
    >
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ letterSpacing: '0.04em' }}
      >
        NEXORA © {new Date().getFullYear()} — News, tuned to what matters.
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Powered by your interests
      </Typography>
    </Box>
  );
}
