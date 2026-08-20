import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Chip } from '@mui/material';
import { SearchWrapper, SearchIconWrapper, StyledInputBase } from './navbar.styles';

const SearchInput = ({ placeholder = 'Search news, topics, or sources...', value, onChange, onSubmit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <SearchWrapper>
      <SearchIconWrapper>
        <SearchIcon fontSize="small" />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        inputProps={{ 'aria-label': 'search' }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: { xs: 'none', md: 'block' },
          pointerEvents: 'none',
        }}
      >
        <Chip
          label="⌘K"
          size="small"
          sx={(theme) => ({
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
            borderRadius: `${theme.shape.borderRadius}px`,
          })}
        />
      </Box>
    </SearchWrapper>
  );
};

export default SearchInput;
