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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as SalesIcon,
  Inventory as InventoryIcon,
  People as StaffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { CURRENCY } from '../../config/business-config';

/**
 * Reports Page (Manager Only)
 * Sales analytics, inventory insights, and staff performance
 */
const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);

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

  // TODO: Replace with real API data in Phase 4.5 Day 5
  const mockData = {
    sales: {
      today: 15240,
      week: 92400,
      month: 385600,
      topItems: [
        { name: 'Butter Chicken', quantity: 45, revenue: 6750 },
        { name: 'Paneer Tikka', quantity: 38, revenue: 5320 },
        { name: 'Biryani', quantity: 32, revenue: 6400 },
      ],
    },
    staff: [
      { name: 'Raj Kumar', orders: 23, sales: 7890 },
      { name: 'Priya Sharma', orders: 18, sales: 5640 },
      { name: 'Amit Patel', orders: 6, sales: 1710 },
    ],
  };

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
                    {CURRENCY.format(mockData.sales.today)}
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
                    {CURRENCY.format(mockData.sales.week)}
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
                    {CURRENCY.format(mockData.sales.month)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Selling Items (Today)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {mockData.sales.topItems.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} orders`}
                      />
                      <Typography variant="h6" color="primary">
                        {CURRENCY.format(item.revenue)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Staff Performance Tab */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Staff Performance (Today)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockData.staff.map((staff, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={staff.name}
                    secondary={`${staff.orders} orders processed`}
                  />
                  <Typography variant="h6" color="primary">
                    {CURRENCY.format(staff.sales)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Inventory Tab */}
        {activeTab === 2 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Inventory Management
            </Typography>
            <Typography color="text.secondary">
              Inventory tracking coming in Phase 6
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Reports;
