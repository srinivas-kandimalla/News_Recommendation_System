import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { loginUser, resetPassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  // Forgot password modal state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ email: '', new_password: '' });
  const [resetLoading, setResetLoading] = useState(false);

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetForm({ ...resetForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      if (res.success) {
        login(res.token);
        showToast('Welcome back!', 'success');
        setTimeout(() => navigate('/'), 600);
      } else {
        showToast(res.message || 'Invalid email or password.', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Sign in failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetForm.email || !resetForm.new_password) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }
    if (resetForm.new_password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    setResetLoading(true);
    try {
      const res = await resetPassword(resetForm);
      if (res.success) {
        showToast(res.message || 'Password reset successfully!', 'success');
        setForm((prev) => ({ ...prev, email: resetForm.email, password: resetForm.new_password }));
        setResetOpen(false);
        setResetForm({ email: '', new_password: '' });
      } else {
        showToast(res.message || 'Password reset failed.', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reset password. Please check your email.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Wordmark */}
        <Typography
          align="center"
          sx={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: '2.2rem',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #60A5FA 0%, #C4B5FD 50%, #F472B6 100%)'
              : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
            letterSpacing: '-0.03em',
          }}
        >
          Nexora
        </Typography>
        <Typography
          align="center"
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3.5 }}
        >
          Sign in to your personalized AI news feed
        </Typography>

        {/* Form panel */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '16px',
            p: 3.5,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(37,99,235,0.06)',
          }}
        >
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            size="small"
            sx={{ mb: 1 }}
          />

          {/* Forgot password link */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
            <Typography
              variant="caption"
              onClick={() => {
                setResetForm({ email: form.email, new_password: '' });
                setResetOpen(true);
              }}
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Forgot password?
            </Typography>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ py: 1.25, fontSize: '0.875rem', fontFamily: '"Inter", sans-serif', borderRadius: '12px' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography
          align="center"
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: '"Inter", sans-serif' }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Create one
          </Link>
        </Typography>
      </Box>

      {/* Forgot Password Dialog Modal */}
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1, maxWidth: 400, width: '100%' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: '"Inter", sans-serif' }}>
          Reset Password
        </DialogTitle>
        <Box component="form" onSubmit={handleResetSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Enter your registered account email and a new password below to reset your credentials.
            </Typography>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Registered Email"
                name="email"
                type="email"
                required
                value={resetForm.email}
                onChange={handleResetChange}
                size="small"
              />
              <TextField
                fullWidth
                label="New Password (min 8 characters)"
                name="new_password"
                type="password"
                required
                value={resetForm.new_password}
                onChange={handleResetChange}
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResetOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={resetLoading}
              sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}
            >
              {resetLoading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: '12px' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Login;