import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useGetOrdersByStatusQuery } from '../../../store/api/orderApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

const DeliveryHistoryPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [timeFilter, setTimeFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch delivered orders
  const { data: deliveredOrders, isLoading } = useGetOrdersByStatusQuery('DELIVERED', {
    pollingInterval: 60000 // Poll every 60 seconds
  });

  // Filter orders for this driver
  const myDeliveries = deliveredOrders?.filter((order: any) =>
    order.assignedDriver?._id === user?._id || order.assignedDriver === user?._id
  ) || [];

  // Apply time filter
  const filteredByTime = myDeliveries.filter((order: any) => {
    const orderDate = new Date(order.deliveredAt || order.updatedAt);
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return orderDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case 'month':
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  // Apply search filter
  const filteredDeliveries = filteredByTime.filter((order: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const orderNumber = (order.orderNumber || order._id.slice(-6)).toLowerCase();
    const customerName = (order.customer?.name || '').toLowerCase();
    return orderNumber.includes(query) || customerName.includes(query);
  });

  // Calculate stats
  const stats = {
    totalDeliveries: filteredDeliveries.length,
    totalEarnings: filteredDeliveries.reduce((sum: number, order: any) => {
      // Assuming 20% commission for driver
      return sum + (order.totalAmount * 0.2);
    }, 0),
    totalDistance: filteredDeliveries.length * 5.5, // Estimated avg 5.5km per delivery
    avgDeliveryTime: 28 // Minutes
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Loading delivery history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Delivery History
      </Typography>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label="Time Period"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
          <MenuItem value="all">All Time</MenuItem>
        </TextField>

        <TextField
          label="Search orders..."
          placeholder="Order # or Customer name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
        />
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <LocalShippingIcon color="primary" sx={{ fontSize: 28, mb: 0.5 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.totalDeliveries}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <MonetizationOnIcon color="success" sx={{ fontSize: 28, mb: 0.5 }} />
              <Typography variant="h5" fontWeight="bold">
                ₹{stats.totalEarnings.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                {stats.totalDistance.toFixed(1)}km
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AccessTimeIcon color="info" sx={{ fontSize: 28, mb: 0.5 }} />
              <Typography variant="h5" fontWeight="bold">
                {stats.avgDeliveryTime}m
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delivery List */}
      {filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Deliveries Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Complete deliveries will appear here'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredDeliveries.map((order: any) => {
            const deliveryTime = new Date(order.deliveredAt || order.updatedAt);
            const earnings = (order.totalAmount * 0.2).toFixed(0); // 20% commission

            return (
              <Card key={order._id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </Typography>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Delivered"
                        color="success"
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        +₹{earnings}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Your earning
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Delivered At
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Delivery Address
                      </Typography>
                      <Typography variant="body2">
                        {order.deliveryAddress || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {order.items && order.items.length > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        Items ({order.items.length})
                      </Typography>
                      <List dense disablePadding>
                        {order.items.slice(0, 2).map((item: any, index: number) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText
                              primary={`${item.quantity}x ${item.name}`}
                              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                            />
                          </ListItem>
                        ))}
                        {order.items.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{order.items.length - 2} more items
                          </Typography>
                        )}
                      </List>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
};

export default DeliveryHistoryPage;
