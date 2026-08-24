import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const NewsCardSkeleton = ({ variant = 'standard' }) => {
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
        <Skeleton variant="text" width={28} height={32} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="55%" height={16} />
        </Box>
      </Box>
    );
  }

  if (variant === 'featured') {
    return (
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ width: { xs: '100%', md: '56%' }, aspectRatio: { xs: '16/9', md: 'unset' }, minHeight: { md: 280 }, flexShrink: 0 }}>
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ transform: 'none', borderRadius: 0 }} />
        </Box>
        <Box sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Skeleton variant="text" width="50%" height={18} />
          <Skeleton variant="text" width="92%" height={32} />
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="85%" height={20} />
          <Skeleton variant="text" width="65%" height={20} />
          <Box sx={{ mt: 'auto' }}><Skeleton variant="rectangular" width={110} height={34} sx={{ borderRadius: 1 }} /></Box>
        </Box>
      </Box>
    );
  }

  // standard
  return (
    <Box sx={{ pb: 2 }}>
      <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '16/9', borderRadius: 1, mb: 1.25 }} />
      <Skeleton variant="text" width="25%" height={16} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="95%" height={22} />
      <Skeleton variant="text" width="75%" height={22} sx={{ mb: 1.5 }} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
  );
};

export default NewsCardSkeleton;
