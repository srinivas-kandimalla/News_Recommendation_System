import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const DEFAULT_CATEGORIES = [
  'All',
  'Technology',
  'Business',
  'World',
  'Sports',
  'Entertainment',
  'Health',
  'Science',
];

const CategoryBar = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory = 'All',
  onSelectCategory,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        py: 1,
        px: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        {categories.map((cat) => {
          const isSelected =
            selectedCategory.toLowerCase() === cat.toLowerCase();

          return (
            <Chip
              key={cat}
              label={cat}
              onClick={() => onSelectCategory && onSelectCategory(cat)}
              clickable
              sx={{
                fontWeight: isSelected ? 600 : 500,
                fontSize: '0.85rem',
                py: 2.2,
                px: 1.5,
                borderRadius: `${theme.shape.borderRadius * 3}px`,
                backgroundColor: isSelected
                  ? theme.palette.primary.main
                  : alpha(theme.palette.text.primary, 0.04),
                color: isSelected
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                border: `1px solid ${
                  isSelected
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
                boxShadow: isSelected
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  : 'none',
                transition: theme.transitions.create(
                  ['background-color', 'color', 'border-color', 'box-shadow', 'transform'],
                  { duration: theme.transitions.duration.shorter }
                ),
                '&:hover': {
                  backgroundColor: isSelected
                    ? theme.palette.primary.dark
                    : alpha(theme.palette.primary.main, 0.08),
                  borderColor: isSelected
                    ? theme.palette.primary.dark
                    : alpha(theme.palette.primary.main, 0.3),
                  transform: 'translateY(-1px)',
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default CategoryBar;
