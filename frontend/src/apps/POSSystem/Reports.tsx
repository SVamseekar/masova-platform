// src/apps/POSSystem/Reports.tsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as SalesIcon,
  Inventory as InventoryIcon,
  People as StaffIcon,
  Assessment as AdvancedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { CURRENCY } from '../../config/business-config';
import {
  useGetTodaySalesMetricsQuery,
  useGetSalesTrendsQuery,
  useGetStaffLeaderboardQuery,
  useGetTopProductsQuery,
} from '../../store/api/analyticsApi';

/**
 * Reports Page (Manager Only)
 * Sales analytics, inventory insights, and staff performance
 */
const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch real data from APIs
  const { data: todayData, isLoading: loadingToday } = useGetTodaySalesMetricsQuery(undefined);
  const { data: weekData, isLoading: loadingWeek } = useGetSalesTrendsQuery({ period: 'WEEKLY' });
  const { data: monthData, isLoading: loadingMonth } = useGetSalesTrendsQuery({ period: 'MONTHLY' });
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProductsQuery({
    period: 'TODAY',
    sortBy: 'REVENUE'
  });
  const { data: staffData, isLoading: loadingStaff } = useGetStaffLeaderboardQuery({
    period: 'TODAY'
  });

  // Check if user is manager
  if (user?.type !== 'MANAGER') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This page is only accessible to managers.
          </Typography>
          <IconButton onClick={() => navigate('/pos')} sx={{ mt: 2 }}>
            <BackIcon />
          </IconButton>
        </Paper>
      </Container>
    );
  }

  const isLoading = loadingToday || loadingWeek || loadingMonth || loadingProducts || loadingStaff;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/pos')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Reports & Analytics
          </Typography>
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ backgroundColor: 'primary.dark' }}
          textColor="inherit"
        >
          <Tab icon={<SalesIcon />} label="Sales" />
          <Tab icon={<StaffIcon />} label="Staff Performance" />
          <Tab icon={<InventoryIcon />} label="Inventory" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && (
          <>
            {/* Sales Tab */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Today's Sales
                      </Typography>
                      <Typography variant="h4" component="div">
                        {CURRENCY.format(todayData?.todaySales || 0)}
                      </Typography>
                      <Typography variant="body2" color={todayData?.percentChangeFromYesterday && todayData.percentChangeFromYesterday >= 0 ? 'success.main' : 'error.main'}>
                        {todayData?.percentChangeFromYesterday ? `${todayData.percentChangeFromYesterday >= 0 ? '+' : ''}${todayData.percentChangeFromYesterday.toFixed(1)}% vs yesterday` : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        This Week
                      </Typography>
                      <Typography variant="h4" component="div">
                        {CURRENCY.format(weekData?.totalSales || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {weekData?.totalOrders || 0} orders
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        This Month
                      </Typography>
                      <Typography variant="h4" component="div">
                        {CURRENCY.format(monthData?.totalSales || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {monthData?.totalOrders || 0} orders
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Top Selling Items (Today)
                      </Typography>
                      <Button
                        startIcon={<AdvancedIcon />}
                        onClick={() => navigate('/manager/product-analytics')}
                      >
                        View Full Analytics
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {topProducts && topProducts.topProducts.length > 0 ? (
                      <Grid container spacing={2}>
                        {topProducts.topProducts.slice(0, 5).map((item) => (
                          <Grid item xs={12} md={6} key={item.itemId}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {item.itemName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.quantitySold} sold
                                </Typography>
                              </Box>
                              <Typography variant="h6" color="primary">
                                {CURRENCY.format(item.revenue)}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography color="text.secondary">No sales data available</Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<AdvancedIcon />}
                    onClick={() => navigate('/manager/advanced-reports')}
                  >
                    View Advanced Reports (Charts & Trends)
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Staff Performance Tab */}
            {activeTab === 1 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Staff Performance (Today)
                  </Typography>
                  <Button
                    startIcon={<AdvancedIcon />}
                    onClick={() => navigate('/manager/staff-leaderboard')}
                  >
                    View Full Leaderboard
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {staffData && staffData.rankings.length > 0 ? (
                  <Grid container spacing={2}>
                    {staffData.rankings.slice(0, 5).map((staff, index) => (
                      <Grid item xs={12} md={6} key={staff.staffId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              #{index + 1} {staff.staffName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {staff.ordersProcessed} orders processed
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            {CURRENCY.format(staff.salesGenerated)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No staff performance data available</Typography>
                )}
              </Paper>
            )}

            {/* Inventory Tab */}
            {activeTab === 2 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Inventory Management
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Comprehensive inventory tracking available
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/manager/inventory')}
                >
                  Go to Inventory Management
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Reports;
