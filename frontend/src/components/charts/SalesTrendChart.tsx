import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetSalesTrendsQuery } from '../../store/api/analyticsApi';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { createCard } from '../../styles/neumorphic-utils';
import { colors } from '../../styles/design-tokens';

export default function SalesTrendChart() {
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  const { data, isLoading, error } = useGetSalesTrendsQuery({ period });

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: 'WEEKLY' | 'MONTHLY' | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  const getTrendIcon = () => {
    if (!data) return null;
    switch (data.trend) {
      case 'UP':
        return <TrendingUpIcon sx={{ color: '#4caf50' }} />;
      case 'DOWN':
        return <TrendingDownIcon sx={{ color: '#f44336' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: '#ff9800' }} />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Paper sx={{ ...createCard('md', 'lg'), height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading sales trends...</Typography>
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ ...createCard('md', 'lg'), height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Failed to load sales trends</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ ...createCard('md', 'lg') }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Sales Trend
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4">
              {formatCurrency(data.totalSales)}
            </Typography>
            {getTrendIcon()}
            <Typography
              variant="body2"
              color={data.percentChangeFromPreviousPeriod >= 0 ? 'success.main' : 'error.main'}
            >
              {data.percentChangeFromPreviousPeriod >= 0 ? '+' : ''}
              {data.percentChangeFromPreviousPeriod.toFixed(1)}% vs previous period
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {data.totalOrders} orders • Avg: {formatCurrency(data.averageOrderValue)}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="WEEKLY">7 Days</ToggleButton>
          <ToggleButton value="MONTHLY">30 Days</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.dataPoints}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            stroke={colors.brand.primary}
            strokeWidth={2}
            name="Sales"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="orderCount"
            stroke={colors.semantic.success}
            strokeWidth={2}
            name="Orders"
            dot={{ r: 4 }}
            yAxisId={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
