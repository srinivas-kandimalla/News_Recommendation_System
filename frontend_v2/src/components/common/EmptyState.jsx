import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Check back soon or try changing your filters.',
  actionLabel,
  onAction,
  icon: Icon,
  compact = false,
}) {
  return (
    <Box
      sx={{
        py: compact ? 4 : 8,
        px: 3,
        textAlign: 'center',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: compact ? 32 : 44,
            color: 'primary.main',
            opacity: 0.4,
            mb: 1.5,
          }}
        />
      )}
      <Typography
        variant={compact ? 'subtitle2' : 'h6'}
        sx={{ fontWeight: 650, mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 380, mx: 'auto', lineHeight: 1.6 }}
      >
        {description}
      </Typography>
      {actionLabel && (
        <Button
          variant="contained"
          onClick={onAction}
          size="small"
          sx={{ mt: 2.5, borderRadius: 6, px: 3 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
