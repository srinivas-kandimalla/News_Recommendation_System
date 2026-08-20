import { CloseRounded, SearchRounded } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search stories, people, topics…', fullWidth = true, autoFocus = false }) {
  const submit = (event) => { event.preventDefault(); onSubmit?.(value.trim()); };
  return (
    <form onSubmit={submit}>
      <TextField fullWidth={fullWidth} autoFocus={autoFocus} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} size="small"
        inputProps={{ 'aria-label': 'Search news' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>, endAdornment: value ? <InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={() => onChange('')}><CloseRounded fontSize="small" /></IconButton></InputAdornment> : null }} />
    </form>
  );
}
