import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuPage from '../../pages/customer/MenuPage';

// Public menu page - no authentication required, with navigation
const PublicMenuPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🍕 MaSoVa
          </Typography>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 1 }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            startIcon={<LocalOfferIcon />}
            onClick={() => navigate('/promotions')}
            sx={{ mr: 1 }}
          >
            Offers
          </Button>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/customer/menu')}
            sx={{ ml: 1 }}
          >
            Order Now
          </Button>
        </Toolbar>
      </AppBar>

      {/* Menu Content */}
      <MenuPage />
    </Box>
  );
};

export default PublicMenuPage;
