import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor = 'primary',
}) => {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.danger || theme.palette.error.main,
  };

  const selectedColor = colorMap[iconColor] || theme.palette.primary.main;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1],
          p: 1,
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {Icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                  backgroundColor: alpha(selectedColor, 0.1),
                  color: selectedColor,
                }}
              >
                <Icon sx={{ fontSize: 24 }} />
              </Box>
            )}
            <Box>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ fontFamily: theme.typography.h5.fontFamily, color: theme.palette.text.primary }}
              >
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {label}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
