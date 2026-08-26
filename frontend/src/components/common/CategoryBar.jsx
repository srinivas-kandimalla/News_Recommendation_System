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
                  ? (isDark ? 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)' : '#0F172A')
                  : (isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.9)'),
                boxShadow: isActive ? (isDark ? '0 4px 12px rgba(56, 189, 248, 0.25)' : '0 4px 12px rgba(15, 23, 42, 0.2)') : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                '&:hover': {
                  color: isActive ? '#FFFFFF' : theme.palette.text.primary,
                  transform: 'translateY(-1px)',
                  background: isActive
                    ? (isDark ? 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)' : '#1E293B')
                    : (isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.95)'),
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

