import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/Insights';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const InsightsWidget = ({ analyticsData }) => {
  const theme = useTheme();

  // Extract analytics or fallback data
  const favoriteCategory = analyticsData?.favorite_category || 'Technology';
  const categoryBreakdown = analyticsData?.category_breakdown || {
    Technology: 68,
    Business: 18,
    Sports: 8,
    Entertainment: 6,
  };

  const labels = Object.keys(categoryBreakdown);
  const dataValues = Object.values(categoryBreakdown);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.danger || '#EF4444',
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card
      sx={{
        borderRadius: `${theme.shape.borderRadius * 2}px`,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        p: 0.5,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.secondary.main,
            }}
          >
            <InsightsIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontSize="1rem" fontWeight={700} color="text.primary">
            Your Reading Insights
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Doughnut Chart Container */}
          <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <Doughnut data={chartData} options={chartOptions} />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={800} color="primary" lineHeight={1}>
                {dataValues[0] || 68}%
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                {favoriteCategory}
              </Typography>
            </Box>
          </Box>

          {/* Category Legend List */}
          <Box sx={{ flexGrow: 1 }}>
            <Stack spacing={1}>
              {labels.slice(0, 4).map((label, index) => (
                <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      {label}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {dataValues[index]}%
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default InsightsWidget;
