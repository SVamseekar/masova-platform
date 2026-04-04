import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuPage from '../../pages/customer/MenuPage';
import CartDrawer from '../../components/cart/CartDrawer';

// Public menu page - no authentication required, with cart functionality
const PublicMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleOpenCart = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
  };

  const handleCheckout = () => {
    // Always navigate to checkout page to show options
    navigate('/checkout');
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Menu Content with integrated header */}
      <MenuPage
        hideStaffLogin={true}
        showPublicNav={true}
        onCartClick={handleOpenCart}
      />

      {/* Cart Drawer */}
      <CartDrawer open={cartDrawerOpen} onClose={handleCloseCart} onCheckout={handleCheckout} />
    </Box>
  );
};

export default PublicMenuPage;
