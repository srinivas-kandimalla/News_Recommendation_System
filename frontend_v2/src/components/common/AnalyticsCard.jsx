import { Box, Card, CardContent, Typography } from '@mui/material';

export default function AnalyticsCard({ label, value, icon: Icon, color = 'primary.main', caption }) {
  return <Card><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.25, p: '20px !important' }}><Box sx={{ width: 46, height: 46, borderRadius: 2.25, display: 'grid', placeItems: 'center', bgcolor: color, color: '#fff', flexShrink: 0 }}>{Icon && <Icon />}</Box><Box><Typography color="text.secondary" variant="body2" fontWeight={650}>{label}</Typography><Typography variant="h4" sx={{ mt: 0.25 }}>{value ?? '—'}</Typography>{caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}</Box></CardContent></Card>;
}
