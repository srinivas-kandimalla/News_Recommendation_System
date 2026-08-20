import { AutoAwesomeRounded } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate, truncate } from '../../utils/formatters';

export default function RecommendationCard({ item }) {
  const navigate = useNavigate();
  const score = Math.round(Math.min(1, Math.max(0, item.hybrid_score ?? item.semantic_score ?? 0)) * 100);
  return (
    <Card sx={{ height: '100%', transition: 'transform .2s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
      <CardActionArea onClick={() => navigate(`/news/${item._id}`)} sx={{ height: '100%', alignItems: 'stretch' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}><Chip label={item.category || 'For you'} size="small" color="secondary" variant="outlined" /><Typography variant="caption" color="text.secondary">{formatDate(item.created_at)}</Typography></Stack>
          <Typography variant="h6" lineHeight={1.32}>{item.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{truncate(item.content || '', 175)}</Typography>
          {item.reason && <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', bgcolor: 'action.hover', p: 1.25, borderRadius: 2, mt: 2 }}><AutoAwesomeRounded color="secondary" fontSize="small" /><Typography variant="caption" color="text.secondary">{item.reason}</Typography></Box>}
          <Box sx={{ mt: 'auto', pt: 2 }}><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Match confidence</Typography><Typography variant="caption" fontWeight={800}>{score}%</Typography></Stack><LinearProgress variant="determinate" value={score} color="secondary" sx={{ mt: .75, height: 6, borderRadius: 4 }} /></Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
