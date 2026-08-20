import { Box, Skeleton, Stack } from '@mui/material';

/** Article-page skeleton matching the editorial reading layout */
export default function ArticleSkeleton() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, md: 0 } }}>
      {/* Back button */}
      <Skeleton width={120} height={36} sx={{ mb: 3, borderRadius: 2 }} />

      {/* Category + date */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Skeleton width={70} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton width={100} height={24} sx={{ borderRadius: 1 }} />
      </Stack>

      {/* Headline */}
      <Skeleton height={52} sx={{ mb: 0.5 }} />
      <Skeleton height={52} width="80%" sx={{ mb: 2 }} />

      {/* Author / source */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Skeleton width={130} height={20} />
        <Skeleton width={80} height={20} />
      </Stack>

      {/* Hero image */}
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 4 }} />

      {/* Article body */}
      {[1, 0.9, 0.95, 0.85, 1, 0.75, 0.92, 0.88].map((w, i) => (
        <Skeleton key={i} width={`${w * 100}%`} height={22} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}
