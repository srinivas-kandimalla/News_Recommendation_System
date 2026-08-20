import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { BookmarkBorderRounded, RefreshRounded } from '@mui/icons-material';
import AppSnackbar from '../components/common/AppSnackbar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CompactNewsItem from '../components/common/CompactNewsItem';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Loader from '../components/common/Loader';
import NewsCard from '../components/common/NewsCard';
import SectionHeader from '../components/common/SectionHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFeedback from '../hooks/useFeedback';
import { getBookmarks, removeBookmark } from '../services/bookmarkService';
import { getApiErrorMessage } from '../utils/apiError';

export default function Bookmarks() {
  useDocumentTitle('Saved stories — Nexora');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [removing, setRemoving] = useState(false);
  const { feedback, notify, dismiss } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBookmarks();
      setItems(data.bookmarks || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmRemove = async () => {
    if (!pending) return;
    setRemoving(true);
    try {
      await removeBookmark(pending._id);
      setItems((prev) => prev.filter((i) => i._id !== pending._id));
      notify('"' + (pending.title || 'Story') + '" removed from bookmarks.');
      setPending(null);
    } catch (err) {
      notify(getApiErrorMessage(err), 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="YOUR READING LIST"
        title="Saved stories"
        description="Articles you've bookmarked, ready when you are."
        action={
          <Button size="small" startIcon={<RefreshRounded />} onClick={load}>
            Refresh
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
          icon={BookmarkBorderRounded}
          title="No saved stories"
          description="Bookmark an article while browsing and it will be waiting here."
          actionLabel="Explore stories"
          onAction={() => window.location.assign('/')}
        />
      ) : (
        <>
          {/* Grid view for larger screens */}
          <Grid container spacing={2.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <NewsCard
                  news={item}
                  bookmarked
                  onBookmark={() => setPending(item)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Compact list for mobile */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, borderTop: '1px solid', borderColor: 'divider' }}>
            {items.map((item, i) => (
              <Box key={item._id}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <CompactNewsItem news={item} />
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    sx={{ flexShrink: 0, fontSize: '0.72rem' }}
                    onClick={() => setPending(item)}
                  >
                    Remove
                  </Button>
                </Stack>
                {i < items.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Remove bookmark?"
        description={`"${pending?.title || 'This story'}" will be removed from your reading list.`}
        confirmLabel="Remove"
        color="error"
        loading={removing}
        onClose={() => setPending(null)}
        onConfirm={confirmRemove}
      />
      <AppSnackbar feedback={feedback} onClose={dismiss} />
    </>
  );
}
