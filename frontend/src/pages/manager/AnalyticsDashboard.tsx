import React from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetSalesTrendsQuery,
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(v);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, highlight }) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      textAlign: 'center',
      borderTop: highlight ? '4px solid #D32F2F' : '4px solid transparent',
    }}
  >
    <Typography variant="h4" fontWeight="bold" color="primary">
      {value}
    </Typography>
    <Typography variant="subtitle1" color="text.secondary" mt={0.5}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.disabled">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const AnalyticsDashboard: React.FC = () => {
  const storeId = useAppSelector(selectSelectedStoreId) ?? undefined;

  const {
    data: salesMetrics,
    isLoading: salesLoading,
    isError: salesError,
  } = useGetTodaySalesMetricsQuery(storeId);

  const { data: aovData, isLoading: aovLoading } = useGetAverageOrderValueQuery(storeId);

  const { data: trendData, isLoading: trendLoading } = useGetSalesTrendsQuery({
    period: 'WEEKLY',
    storeId,
  });

  const { data: topProductsData, isLoading: productsLoading } = useGetTopProductsQuery({
    period: 'WEEKLY',
    sortBy: 'QUANTITY',
    storeId,
  });

  const isLoading = salesLoading || aovLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={56} />
      </Box>
    );
  }

  if (salesError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load analytics. Make sure the intelligence-service (port 8087) is running and
          the API gateway is proxying /api/analytics correctly.
        </Alert>
      </Box>
    );
  }

  // Map weekly trend dataPoints → chart format
  const trendChartData = trendData?.dataPoints?.map((dp) => ({
    date: dp.label,
    revenue: dp.sales,
    orders: dp.orderCount,
  })) ?? [];

  // Map top products → chart format (top 10)
  const productsChartData =
    topProductsData?.topProducts?.slice(0, 10).map((p) => ({
      name: p.itemName.length > 14 ? p.itemName.slice(0, 12) + '…' : p.itemName,
      quantity: p.quantitySold,
      revenue: Math.round(p.revenue),
    })) ?? [];

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Today&apos;s overview — live data from intelligence-service
      </Typography>

      {/* KPI stat cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={formatINR(salesMetrics?.todaySales ?? 0)}
            subtitle={
              salesMetrics
                ? `${salesMetrics.trend === 'UP' ? '+' : ''}${salesMetrics.percentChangeFromYesterday.toFixed(1)}% vs yesterday`
                : undefined
            }
            highlight
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Orders"
            value={salesMetrics?.todayOrderCount ?? 0}
            subtitle={
              salesMetrics
                ? `${salesMetrics.yesterdayOrderCountAtSameTime} at same time yesterday`
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Order Value"
            value={formatINR(aovData?.averageOrderValue ?? 0)}
            subtitle={
              aovData
                ? `${aovData.trend === 'UP' ? '+' : ''}${aovData.percentChange.toFixed(1)}% vs yesterday`
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales (today)"
            value={formatINR(aovData?.totalSales ?? 0)}
            subtitle={aovData ? `${aovData.totalOrders} orders` : undefined}
          />
        </Grid>
      </Grid>

      {/* Weekly Revenue + Orders Trend */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Weekly Revenue Trend
        </Typography>
        {trendLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={36} />
          </Box>
        ) : trendChartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
            No trend data available
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendChartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'revenue' ? [formatINR(value), 'Revenue'] : [value, 'Orders']
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D32F2F"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#1565C0"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Orders"
                yAxisId={0}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Top Products Bar Chart */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Top Products This Week (by units sold)
        </Typography>
        {productsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={36} />
          </Box>
        ) : productsChartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
            No product sales data available
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={productsChartData}
              margin={{ top: 4, right: 20, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'revenue' ? [formatINR(value), 'Revenue'] : [value, 'Units Sold']
                }
              />
              <Legend verticalAlign="top" />
              <Bar dataKey="quantity" fill="#D32F2F" name="Units Sold" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#FF8F00" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
};

export default AnalyticsDashboard;
