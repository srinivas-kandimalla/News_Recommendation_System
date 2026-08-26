import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { loginUser, resetPassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { NexoraIcon } from '../components/common/NexoraLogo';

function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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

  const primaryAccent = isDark ? '#38BDF8' : '#2563EB';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Clean Form Card */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 3.5, sm: 4.5 },
            borderRadius: '24px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.45)' : '0 12px 40px rgba(37,99,235,0.06)',
            textAlign: 'center',
          }}
        >
          {/* Logo Mark Icon only above Welcome Back */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
              border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <NexoraIcon size={32} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontWeight: 800,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              mb: 0.75,
              fontSize: { xs: '1.45rem', sm: '1.65rem' },
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 3.5 }}>
            Please enter your details to sign in.
          </Typography>

          <Stack spacing={2.5} sx={{ textAlign: 'left' }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.85 }}>
                <Typography
                  variant="caption"
                  onClick={() => {
                    setResetForm({ email: form.email, new_password: '' });
                    setResetOpen(true);
                  }}
                  sx={{
                    color: primaryAccent,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.35,
                mt: 1,
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: '"Inter", sans-serif',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                  boxShadow: '0 6px 18px rgba(37,99,235,0.35)',
                },
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 3 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: primaryAccent,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Create account
            </Link>
          </Typography>
        </Paper>
      </Box>

      {/* Forgot Password Dialog Modal */}
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            maxWidth: 400,
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Reset Password
        </DialogTitle>
        <Box component="form" onSubmit={handleResetSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
              Enter your account email and a new password below to reset credentials.
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setResetOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={resetLoading}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 3,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
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