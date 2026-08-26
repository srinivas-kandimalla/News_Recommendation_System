import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { registerUser } from '../services/authService';
import { NexoraIcon } from '../components/common/NexoraLogo';

function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser(form);
      if (res.success) {
        showToast('Account created successfully! Redirecting to sign in…', 'success');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        showToast(res.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
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
          {/* Logo Mark Icon only above Create Account */}
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
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 3.5 }}>
            Please enter your details to register.
          </Typography>

          <Stack spacing={2.5} sx={{ textAlign: 'left' }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'block', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Full Name
              </Typography>
              <TextField
                fullWidth
                name="name"
                type="text"
                required
                placeholder="Enter your name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
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
                Password (min 8 characters)
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                autoComplete="new-password"
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
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 3 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: primaryAccent,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Paper>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: '12px' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Register;