import { useState } from 'react';
import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { ArrowForwardRounded } from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getApiErrorMessage } from '../utils/apiError';

export default function Login() {
  useDocumentTitle('Sign in — Nexora');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not sign you in. Check your credentials.'));
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
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue building a smarter reading feed.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
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
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
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
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary" textAlign="center">
        New to Nexora?{' '}
        <Link component={RouterLink} to="/register" fontWeight={700} color="primary">
          Create your account
        </Link>
      </Typography>
    </>
  );
}
