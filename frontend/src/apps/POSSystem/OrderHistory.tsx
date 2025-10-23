// src/apps/POSSystem/OrderHistory.tsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetOrdersByStoreQuery } from '../../store/api/orderApi';
import { useAppSelector } from '../../store/hooks';
import { CURRENCY } from '../../config/business-config';

/**
 * Order History Page
 * Shows all orders for today with search and filter capabilities
 */
const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const storeId = user?.employeeDetails?.storeId;

  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders = [], isLoading, error } = useGetOrdersByStoreQuery(
    { storeId: storeId || '' },
    { skip: !storeId }
  );

  // Filter today's orders
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  });

  // Search filter
  const filteredOrders = todayOrders.filter((order: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerPhone?.includes(searchTerm)
    );
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      PREPARING: 'primary',
      READY: 'success',
      OUT_FOR_DELIVERY: 'secondary',
      DELIVERED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const handlePrintOrder = (orderId: string) => {
    // TODO: Implement print functionality
    alert(`Print functionality for order ${orderId} coming soon!`);
  };

  const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/pos')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Order History - Today
          </Typography>
          <Typography variant="body2">
            {filteredOrders.length} orders • {CURRENCY.format(totalSales)}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by order number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Orders Table */}
        <Paper>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load orders. Please try again.
            </Alert>
          )}

          {!isLoading && !error && filteredOrders.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'No orders found matching your search' : 'No orders today yet'}
              </Typography>
            </Box>
          )}

          {!isLoading && !error && filteredOrders.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Order #</strong></TableCell>
                    <TableCell><strong>Time</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Items</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Payment</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order: any) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.customerName || 'Walk-in'}</Typography>
                        {order.customerPhone && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {order.customerPhone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={order.orderType.replace('_', ' ')} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.items?.length || 0} items</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {CURRENCY.format(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ')}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentMethod}
                          size="small"
                          variant="outlined"
                        />
                        {order.paymentStatus === 'PAID' && (
                          <Typography variant="caption" color="success.main" display="block">
                            ✓ Paid
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handlePrintOrder(order.id)}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => navigate(`/manager/orders/${order.id}`)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default OrderHistory;
