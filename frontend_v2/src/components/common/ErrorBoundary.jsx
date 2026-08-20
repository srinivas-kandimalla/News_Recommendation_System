import { Component } from 'react';
import { Button, Container, Paper, Typography } from '@mui/material';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('UI error boundary:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <Container maxWidth="sm" sx={{ py: 12 }}><Paper sx={{ p: 4, textAlign: 'center' }}><Typography variant="h5">We hit an unexpected error</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Refresh the page to get back to your news feed.</Typography><Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()}>Refresh page</Button></Paper></Container>;
  }
}
