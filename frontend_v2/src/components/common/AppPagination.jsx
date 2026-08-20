import { Box, Pagination } from '@mui/material';

export default function AppPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><Pagination page={page} count={totalPages} color="primary" onChange={(_, nextPage) => onChange(nextPage)} showFirstButton showLastButton /></Box>;
}
