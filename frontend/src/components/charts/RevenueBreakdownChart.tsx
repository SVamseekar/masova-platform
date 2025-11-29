import { Box, Paper, Typography } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useGetOrderTypeBreakdownQuery } from '../../store/api/analyticsApi';
import { createCard } from '../../styles/neumorphic-utils';
import { colors } from '../../styles/design-tokens';

const COLORS = [
  colors.brand.primary,      // MaSoVa red for primary
  colors.brand.secondary,    // Blue for secondary
  colors.semantic.success,   // Green
  colors.semantic.warning,   // Orange
];

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'Dine-In',
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
};

export default function RevenueBreakdownChart() {
  const { data, isLoading, error } = useGetOrderTypeBreakdownQuery(undefined);

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
        <Typography>Loading revenue breakdown...</Typography>
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ ...createCard('md', 'lg'), height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Failed to load revenue breakdown</Typography>
      </Paper>
    );
  }

  const chartData = data.breakdown.map((item) => ({
    name: ORDER_TYPE_LABELS[item.orderType] || item.orderType,
    value: item.sales,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <Paper sx={{ ...createCard('md', 'lg') }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Revenue by Order Type
        </Typography>
        <Typography variant="h4">
          {formatCurrency(data.totalSales)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.totalOrders} orders today
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#000' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {data.breakdown.map((item, index) => (
          <Box key={item.orderType} sx={{ flex: 1, minWidth: 150 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: COLORS[index % COLORS.length],
                }}
              />
              <Typography variant="body2" fontWeight="bold">
                {ORDER_TYPE_LABELS[item.orderType] || item.orderType}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {item.count} orders • {formatCurrency(item.averageOrderValue)} avg
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
