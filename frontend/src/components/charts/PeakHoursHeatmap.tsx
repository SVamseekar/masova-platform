import { Box, Paper, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGetPeakHoursQuery } from '../../store/api/analyticsApi';
import { createCard } from '../../styles/neumorphic-utils';
import { colors } from '../../styles/design-tokens';

interface PeakHoursHeatmapProps {
  storeId: string;
}

export default function PeakHoursHeatmap({ storeId }: PeakHoursHeatmapProps) {
  const { data, isLoading, error } = useGetPeakHoursQuery(undefined);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getBarColor = (hour: number) => {
    if (!data) return colors.brand.secondary;
    if (hour === data.peakHour) return colors.semantic.success; // Green for peak hour
    if (hour === data.slowestHour) return colors.semantic.error; // Red for slowest hour
    return colors.brand.secondary; // Default blue
  };

  if (isLoading) {
    return (
      <Paper sx={{ ...createCard('md', 'lg'), height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading peak hours data...</Typography>
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ ...createCard('md', 'lg'), height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Failed to load peak hours data</Typography>
      </Paper>
    );
  }

  // Filter out hours with no orders for better visualization
  const activeHours = data.hourlyData.filter((h) => h.orderCount > 0);

  return (
    <Paper sx={{ ...createCard('md', 'lg') }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Peak Hours Analysis
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Peak Hour
            </Typography>
            <Typography variant="h5" color="success.main">
              {data.hourlyData[data.peakHour]?.label}
            </Typography>
            <Typography variant="body2">
              {data.peakHourOrders} orders • {formatCurrency(data.peakHourSales)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Slowest Hour
            </Typography>
            <Typography variant="h5" color="error.main">
              {data.hourlyData[data.slowestHour]?.label}
            </Typography>
            <Typography variant="body2">
              {data.hourlyData[data.slowestHour]?.orderCount} orders
            </Typography>
          </Box>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={activeHours}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'sales') return formatCurrency(value);
              return value;
            }}
            labelStyle={{ color: '#000' }}
          />
          <Bar dataKey="orderCount" name="Orders" radius={[8, 8, 0, 0]}>
            {activeHours.map((entry) => (
              <Cell key={entry.hour} fill={getBarColor(entry.hour)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 1 }} />
          <Typography variant="caption">Peak Hour</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#8884d8', borderRadius: 1 }} />
          <Typography variant="caption">Normal</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: 1 }} />
          <Typography variant="caption">Slowest Hour</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
