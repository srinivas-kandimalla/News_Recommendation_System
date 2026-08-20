import { useState } from 'react';
import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { ArrowForwardRounded } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getApiErrorMessage } from '../utils/apiError';

export default function Register() {
  useDocumentTitle('Create account — Nexora');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setSuccess(res.message || 'Account created — sign in to get started.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 750, letterSpacing: '-0.03em', mb: 0.75 }}
        >
          Build your reading space
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nexora learns what you care about with every story you read.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField
            required
            label="Your name"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            disabled={loading}
          />
          <TextField
            required
            type="email"
            label="Email address"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            disabled={loading}
          />
          <TextField
            required
            type="password"
            label="Password"
            helperText="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            disabled={loading}
          />
          <TextField
            required
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            disabled={loading}
          />
          <Button
            type="submit"
            size="large"
            variant="contained"
            endIcon={<ArrowForwardRounded />}
            disabled={loading}
            sx={{ borderRadius: 2, py: 1.25, mt: 0.5 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" fontWeight={700} color="primary">
          Sign in
        </Link>
      </Typography>
    </>
  );
}
