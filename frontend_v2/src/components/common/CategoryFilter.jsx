import { Chip, Stack } from '@mui/material';

export default function CategoryFilter({ categories, value, onChange }) {
  return <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Chip label="All topics" color={!value ? 'primary' : 'default'} variant={!value ? 'filled' : 'outlined'} onClick={() => onChange('')} />{categories.map((category) => <Chip key={category} label={category} color={value === category ? 'primary' : 'default'} variant={value === category ? 'filled' : 'outlined'} onClick={() => onChange(category)} />)}</Stack>;
}
