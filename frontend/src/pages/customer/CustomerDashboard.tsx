import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Badge, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAppSelector } from '../../store/hooks';
import MenuPage from './MenuPage';
import CartPage from './CartPage';
import PaymentPage from './PaymentPage';
import TrackingPage from './TrackingPage';

type ViewType = 'menu' | 'cart' | 'payment' | 'tracking';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const cartItems = useAppSelector(state => state.cart.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🍕 MaSoVa
          </Typography>

          <Button
            color={currentView === 'menu' ? 'primary' : 'inherit'}
            startIcon={<MenuBookIcon />}
            onClick={() => setCurrentView('menu')}
            sx={{ mx: 1, fontWeight: currentView === 'menu' ? 'bold' : 'normal' }}
          >
            Menu
          </Button>

          <Button
            color={currentView === 'cart' ? 'primary' : 'inherit'}
            startIcon={
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            }
            onClick={() => setCurrentView('cart')}
            sx={{ mx: 1, fontWeight: currentView === 'cart' ? 'bold' : 'normal' }}
          >
            Cart
          </Button>

          <Button
            color={currentView === 'payment' ? 'primary' : 'inherit'}
            startIcon={<PaymentIcon />}
            onClick={() => setCurrentView('payment')}
            sx={{ mx: 1, fontWeight: currentView === 'payment' ? 'bold' : 'normal' }}
          >
            Payment
          </Button>

          <Button
            color={currentView === 'tracking' ? 'primary' : 'inherit'}
            startIcon={<TrackChangesIcon />}
            onClick={() => setCurrentView('tracking')}
            sx={{ mx: 1, fontWeight: currentView === 'tracking' ? 'bold' : 'normal' }}
          >
            Track
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box>
        {currentView === 'menu' && <MenuPage hideStaffLogin={true} />}
        {currentView === 'cart' && <CartPage onContinueShopping={() => setCurrentView('menu')} onProceedToPayment={() => setCurrentView('payment')} />}
        {currentView === 'payment' && <PaymentPage onBack={() => setCurrentView('cart')} onComplete={() => setCurrentView('tracking')} />}
        {currentView === 'tracking' && <TrackingPage onBackToMenu={() => setCurrentView('menu')} />}
      </Box>
    </Box>
  );
};

export default CustomerDashboard;
