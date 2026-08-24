import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { registerUser } from '../services/authService';

function Register() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
        showToast('Account created! Redirecting to sign in…', 'success');
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
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Wordmark */}
        <Typography
          align="center"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: theme.palette.text.primary,
            mb: 0.5,
            letterSpacing: '-0.02em',
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
          Create your account
        </Typography>

        {/* Form panel */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <TextField
            fullWidth
            label="Full name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            size="small"
            sx={{ mb: 2 }}
          />
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            size="small"
            sx={{ mb: 2.5 }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ py: 1.25, fontSize: '0.875rem', fontFamily: '"Inter", sans-serif' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography
          align="center"
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: '"Inter", sans-serif' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 1 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Register;