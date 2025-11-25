// src/apps/POSSystem/POSDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Assessment as ReportsIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import CustomerPanel from './components/CustomerPanel';
import MetricsTiles from './components/MetricsTiles';

/**
 * POS Dashboard - Main Interface
 * 3-column layout: Menu (left) | Order Builder (center) | Customer/Payment (right)
 */
const POSDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Current order state
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'PICKUP' | 'DELIVERY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Ref for triggering submit from keyboard shortcut
  const submitOrderRef = React.useRef<() => void>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1: New Order
      if (e.key === 'F1') {
        e.preventDefault();
        handleNewOrder();
      }
      // F2: View History
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos/history');
      }
      // F3: Reports (Manager only)
      if (e.key === 'F3' && isManager) {
        e.preventDefault();
        navigate('/pos/reports');
      }
      // Escape: Clear order
      if (e.key === 'Escape') {
        e.preventDefault();
        handleNewOrder();
      }
      // Ctrl+Enter: Submit order
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (submitOrderRef.current) {
          submitOrderRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isManager]);

  const isManager = user?.type === 'MANAGER';
  const storeId = user?.employeeDetails?.storeId;

  const handleAddItem = (item: any, quantity: number = 1) => {
    const existingIndex = orderItems.findIndex(
      (orderItem) => orderItem.menuItemId === item.id
    );

    if (existingIndex >= 0) {
      // Update quantity
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          specialInstructions: '',
          image: item.image,
        },
      ]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter((item) => item.menuItemId !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleUpdateInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(
      orderItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setCustomer(null);
    setSelectedTable(null);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Badge badgeContent={orderItems.length} color="error" sx={{ mr: 2 }}>
            <DashboardIcon />
          </Badge>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            POS System - {user?.name || 'Staff'}
            {storeId && (
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Store: {storeId}
              </Typography>
            )}
          </Typography>

          <Tooltip title="View Order History (F2)">
            <IconButton color="inherit" onClick={() => navigate('/pos/history')}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>

          {isManager && (
            <Tooltip title="View Reports (F3)">
              <IconButton color="inherit" onClick={() => navigate('/pos/reports')}>
                <ReportsIcon />
              </IconButton>
            </Tooltip>
          )}

          {isManager && (
            <Tooltip title="Manager Dashboard">
              <IconButton color="inherit" onClick={() => navigate('/manager')}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Metrics Tiles */}
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <MetricsTiles storeId={storeId} />
      </Box>

      {/* Main Content Area - 3 Column Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2, backgroundColor: '#f5f5f5' }}>
        {!user && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please log in to access the POS system
          </Alert>
        )}

        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* LEFT: Menu Panel */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <MenuPanel onAddItem={handleAddItem} />
            </Paper>
          </Grid>

          {/* CENTER: Order Panel */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <OrderPanel
                items={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateInstructions={handleUpdateInstructions}
                onNewOrder={handleNewOrder}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
              />
            </Paper>
          </Grid>

          {/* RIGHT: Customer & Payment Panel */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <CustomerPanel
                items={orderItems}
                customer={customer}
                onCustomerChange={setCustomer}
                orderType={orderType}
                selectedTable={selectedTable}
                onOrderComplete={handleNewOrder}
                userId={user?.id}
                storeId={storeId}
                submitOrderRef={submitOrderRef}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Keyboard Shortcuts Help */}
      <Box
        sx={{
          p: 1,
          backgroundColor: '#333',
          color: 'white',
          textAlign: 'center',
          fontSize: '0.75rem',
        }}
      >
        <Typography variant="caption">
          <strong>Shortcuts:</strong> F1: New Order | F2: History | {isManager && 'F3: Reports | '}
          ESC: Clear Order | Ctrl+Enter: Submit Order
        </Typography>
      </Box>
    </Box>
  );
};

export default POSDashboard;
