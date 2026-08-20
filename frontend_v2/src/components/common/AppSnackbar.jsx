import { Alert, Snackbar } from '@mui/material';

export default function AppSnackbar({ feedback, onClose }) {
  return (
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 72, md: 24 } }} // account for mobile bottom nav
    >
      <Alert
        severity={feedback?.severity || 'info'}
        variant="filled"
        onClose={onClose}
        sx={{ borderRadius: 2, minWidth: 260, fontWeight: 500 }}
      >
        {feedback?.message}
      </Alert>
    </Snackbar>
  );
}
