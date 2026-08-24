import React from 'react';
import { Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const CATEGORIES = ['All', 'Technology', 'Sports', 'Business', 'Science', 'Entertainment', 'Health', 'World'];

const CategoryBar = ({ selectedCategory, onSelectCategory, categories }) => {
  const theme = useTheme();
  const cats = categories || CATEGORIES;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        py: 1.5,
        mb: 2,
        overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content', px: 0.5 }}>
        {cats.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Box
              key={cat}
              onClick={() => onSelectCategory(cat)}
              sx={{
                px: 2.25,
                py: 0.85,
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                color: isActive ? '#FFFFFF' : theme.palette.text.secondary,
                background: isActive
                  ? (isDark ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)')
                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.9)'),
                boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.25s ease',
                userSelect: 'none',
                '&:hover': {
                  color: isActive ? '#FFFFFF' : theme.palette.text.primary,
                  transform: 'translateY(-1px)',
                  background: isActive
                    ? (isDark ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)')
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)'),
                },
              }}
            >
              {cat}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default CategoryBar;

