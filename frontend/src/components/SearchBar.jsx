import { TextField } from "@mui/material";

function SearchBar({ value, onChange }) {
  return (
    <TextField
      fullWidth
      label="Search News..."
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ mb: 4 }}
    />
  );
}

export default SearchBar;