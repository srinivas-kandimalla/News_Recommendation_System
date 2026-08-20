import { useCallback, useEffect, useState } from 'react';
import { Button, Grid, Typography, Box, Stack } from '@mui/material';
import { AutoAwesomeRounded, RefreshRounded } from '@mui/icons-material';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Loader from '../components/common/Loader';
import NewsCard from '../components/common/NewsCard';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getPersonalizedRecommendations } from '../services/recommendationService';
import { getApiErrorMessage } from '../utils/apiError';
import { addBookmark, getBookmarks, removeBookmark } from '../services/bookmarkService';
import useFeedback from '../hooks/useFeedback';
import AppSnackbar from '../components/common/AppSnackbar';
import { useAuth } from '../context/AuthContext';

export default function Recommendations() {
  useDocumentTitle('For you — Nexora');
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(new Set());
  const { feedback, notify, dismiss } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPersonalizedRecommendations();
      setItems(data.recommendations || []);
    } catch (err) {
      if (err.response?.status === 404) setItems([]);
      else setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getBookmarks()
      .then((d) => setBookmarked(new Set((d.bookmarks || []).map((b) => b._id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const toggleBookmark = async (item) => {
    const id = item._id;
    try {
      if (bookmarked.has(id)) {
        await removeBookmark(id);
        setBookmarked((prev) => { const s = new Set(prev); s.delete(id); return s; });
        notify('Bookmark removed.');
      } else {
        await addBookmark(id);
        setBookmarked((prev) => new Set(prev).add(id));
        notify('Saved to bookmarks.');
      }
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="NEXORA FOR YOU"
        title="Your next good read"
        description="Recommendations blend your reading history, interests, recency, and community signals."
        action={
          <Button size="small" startIcon={<RefreshRounded />} onClick={load}>
            Refresh picks
          </Button>
        }
        sx={{ mb: 4 }}
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={AutoAwesomeRounded}
          title="Your feed is ready to learn"
          description="Read a few stories first and Nexora will start building recommendations around your interests."
          actionLabel="Explore stories"
          onAction={() => window.location.assign('/')}
        />
      ) : (
        <Grid container spacing={2.5}>
          {items.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <NewsCard
                news={item}
                priority={i < 3}
                bookmarked={bookmarked.has(item._id)}
                onBookmark={toggleBookmark}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
