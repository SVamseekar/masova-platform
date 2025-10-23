import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NavigationIcon from '@mui/icons-material/Navigation';
import { useGetOrdersByStatusQuery, useUpdateOrderStatusMutation } from '../../../store/api/orderApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import NavigationMap from '../components/NavigationMap';
import CustomerContact from '../components/CustomerContact';

const ActiveDeliveryPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Fetch orders assigned to this driver with status OUT_FOR_DELIVERY
  const { data: activeOrders, isLoading, refetch } = useGetOrdersByStatusQuery('OUT_FOR_DELIVERY', {
    pollingInterval: 30000 // Poll every 30 seconds
  });

  // Filter orders assigned to current driver
  const myDeliveries = activeOrders?.filter((order: any) =>
    order.assignedDriver?._id === user?._id || order.assignedDriver === user?._id
  ) || [];

  useEffect(() => {
    // Auto-select first order if available
    if (myDeliveries.length > 0 && !selectedOrder) {
      setSelectedOrder(myDeliveries[0]);
    }
  }, [myDeliveries, selectedOrder]);

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus({
        orderId,
        status: 'DELIVERED'
      }).unwrap();

      // Clear selection and refetch
      setSelectedOrder(null);
      refetch();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    }
  };

  const handlePickedUp = async (orderId: string) => {
    try {
      await updateOrderStatus({
        orderId,
        status: 'OUT_FOR_DELIVERY'
      }).unwrap();

      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Loading deliveries...</Typography>
      </Container>
    );
  }

  if (myDeliveries.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          No active deliveries at the moment. New orders will appear here automatically.
        </Alert>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <NavigationIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Active Deliveries
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up! Wait for new delivery assignments.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Active Deliveries ({myDeliveries.length})
      </Typography>

      <Stack spacing={2}>
        {myDeliveries.map((order: any) => {
          const customerAddress = order.deliveryAddress || order.customer?.address || 'Address not provided';
          const customerPhone = order.customer?.phone || order.customer?.phoneNumber || 'Phone not provided';
          const customerName = order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Customer';

          return (
            <Card
              key={order._id}
              sx={{
                border: selectedOrder?._id === order._id ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              <CardContent>
                {/* Order Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </Typography>
                    <Chip
                      label={order.status}
                      color="warning"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    ₹{order.totalAmount}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Customer Details */}
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOnIcon color="action" />
                    <Box flexGrow={1}>
                      <Typography variant="caption" color="text.secondary">
                        Delivery Address
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {customerAddress}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon color="action" />
                    <Box flexGrow={1}>
                      <Typography variant="caption" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {customerName} - {customerPhone}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTimeIcon color="action" />
                    <Box flexGrow={1}>
                      <Typography variant="caption" color="text.secondary">
                        Order Time
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Order Items */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Items ({order.items?.length || 0})
                  </Typography>
                  <List dense disablePadding>
                    {order.items?.slice(0, 3).map((item: any, index: number) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText
                          primary={`${item.quantity}x ${item.name}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {order.items?.length > 3 && (
                      <ListItem disablePadding>
                        <ListItemText
                          primary={`+${order.items.length - 3} more items`}
                          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DirectionsIcon />}
                    onClick={() => openGoogleMaps(customerAddress)}
                    fullWidth
                  >
                    Navigate
                  </Button>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowContactDialog(true);
                    }}
                  >
                    <PhoneIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    color="success"
                    onClick={() => handleMarkDelivered(order._id)}
                    fullWidth
                  >
                    Delivered
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Customer Contact Dialog */}
      {selectedOrder && (
        <CustomerContact
          open={showContactDialog}
          onClose={() => setShowContactDialog(false)}
          customerName={selectedOrder.customer?.name || `${selectedOrder.customer?.firstName || ''} ${selectedOrder.customer?.lastName || ''}`.trim()}
          customerPhone={selectedOrder.customer?.phone || selectedOrder.customer?.phoneNumber}
          orderNumber={selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}
        />
      )}
    </Container>
  );
};

export default ActiveDeliveryPage;
