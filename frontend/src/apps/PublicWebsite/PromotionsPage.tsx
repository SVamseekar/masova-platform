import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Button,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import PromotionCard from './components/PromotionCard';

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // All promotions
  const allPromotions = [
    {
      id: 1,
      title: 'Weekend Special',
      description: 'Get 20% OFF on all pizzas this weekend!',
      discount: '20% OFF',
      validUntil: 'Valid till Sunday',
      image: '/images/pizza-promo.jpg',
      category: 'Pizza'
    },
    {
      id: 2,
      title: 'Family Combo',
      description: '2 Large Pizzas + 2 Breads + 2 Drinks at ₹999',
      discount: 'Save ₹300',
      validUntil: 'Limited time offer',
      image: '/images/combo-promo.jpg',
      category: 'Combo'
    },
    {
      id: 3,
      title: 'Free Delivery',
      description: 'Free delivery on orders above ₹500',
      discount: 'Free Delivery',
      validUntil: 'All week',
      image: '/images/delivery-promo.jpg',
      category: 'Delivery'
    },
    {
      id: 4,
      title: 'Biryani Bonanza',
      description: 'Buy 2 Biryanis, Get 1 Raita Free',
      discount: 'Free Raita',
      validUntil: 'Valid till Friday',
      image: '/images/biryani-promo.jpg',
      category: 'Biryani'
    },
    {
      id: 5,
      title: 'Lunch Special',
      description: 'Combo Meal with Main + Bread + Drink at ₹299',
      discount: '₹299 Only',
      validUntil: '12 PM - 3 PM',
      image: '/images/lunch-promo.jpg',
      category: 'Combo'
    },
    {
      id: 6,
      title: 'Dessert Delight',
      description: 'Order any 2 desserts and get 30% OFF',
      discount: '30% OFF',
      validUntil: 'Valid all week',
      image: '/images/dessert-promo.jpg',
      category: 'Desserts'
    },
    {
      id: 7,
      title: 'First Order Bonus',
      description: 'New customers get ₹150 OFF on orders above ₹500',
      discount: '₹150 OFF',
      validUntil: 'For new users only',
      image: '/images/firstorder-promo.jpg',
      category: 'Delivery'
    },
    {
      id: 8,
      title: 'Pizza Party Pack',
      description: '4 Medium Pizzas + 4 Drinks at ₹1599',
      discount: 'Save ₹500',
      validUntil: 'Perfect for parties',
      image: '/images/party-promo.jpg',
      category: 'Pizza'
    }
  ];

  const categories = [
    { label: 'All Offers', value: 'all' },
    { label: 'Pizza', value: 'Pizza' },
    { label: 'Biryani', value: 'Biryani' },
    { label: 'Combos', value: 'Combo' },
    { label: 'Desserts', value: 'Desserts' },
    { label: 'Delivery', value: 'Delivery' }
  ];

  const filteredPromotions = selectedCategory === 'all'
    ? allPromotions
    : allPromotions.filter(promo => promo.category === selectedCategory);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Special Offers & Promotions
          </Typography>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Amazing Deals Just for You!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Check out our latest offers and save big on your favorite food
          </Typography>
        </Container>
      </Box>

      {/* Category Tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Tabs
            value={selectedCategory}
            onChange={(_, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem'
              }
            }}
          >
            {categories.map((cat) => (
              <Tab key={cat.value} label={cat.label} value={cat.value} />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* Promotions Grid */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {filteredPromotions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No promotions available in this category
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Check back soon for exciting offers!
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              {selectedCategory === 'all'
                ? `All Offers (${filteredPromotions.length})`
                : `${selectedCategory} Offers (${filteredPromotions.length})`}
            </Typography>
            <Grid container spacing={3}>
              {filteredPromotions.map((promo) => (
                <Grid item xs={12} sm={6} md={4} key={promo.id}>
                  <PromotionCard
                    promotion={promo}
                    onOrderNow={() => navigate('/customer/menu')}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to Order?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Browse our complete menu and place your order now!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/customer/menu')}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            View Full Menu
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default PromotionsPage;
