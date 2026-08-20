import { Card, CardContent, Skeleton, Stack, Box } from '@mui/material';

export default function NewsSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, index) => (
    <Card key={index} sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" height={180} />
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Skeleton width={60} height={20} sx={{ borderRadius: 1 }} />
            <Skeleton width={80} height={20} sx={{ borderRadius: 1 }} />
          </Stack>
          <Skeleton height={20} />
          <Skeleton height={20} width="88%" />
          <Skeleton height={16} />
          <Skeleton height={16} width="70%" />
        </Stack>
      </CardContent>
    </Card>
  ));
}
