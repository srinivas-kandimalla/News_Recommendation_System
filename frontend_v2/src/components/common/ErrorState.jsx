import { Alert, Box, Button } from '@mui/material';
import { RefreshRounded } from '@mui/icons-material';

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  compact = false,
}) {
  return (
    <Box sx={{ py: compact ? 2 : 4 }}>
      <Alert
        severity="error"
        sx={{ borderRadius: 2 }}
        action={
          onRetry && (
            <Button
              size="small"
              startIcon={<RefreshRounded />}
              onClick={onRetry}
              color="error"
            >
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
