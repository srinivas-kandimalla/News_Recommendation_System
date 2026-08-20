import { Box, CircularProgress } from '@mui/material';

export default function Loader({ minHeight = 240, size = 28 }) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress
        size={size}
        thickness={3}
        color="primary"
        aria-label="Loading content"
      />
    </Box>
  );
}
