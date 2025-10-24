import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PromotionCard from './components/PromotionCard';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { Button } from '../../components/ui/neumorphic';
import { colors, spacing } from '../../styles/design-tokens';

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleOpenCart = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

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
    <>
      {/* Animated Background */}
      <AnimatedBackground variant="default" />

      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* Navigation Header */}
        <Box sx={{ px: 4, pt: 4 }}>
          <AppHeader
            title="Special Offers & Promotions"
            showBackButton={true}
            backRoute="/"
            hideStaffLogin={true}
            showPublicNav={true}
            onCartClick={handleOpenCart}
          />
        </Box>

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
                    onOrderNow={() => navigate('/menu')}
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
            variant="primary"
            size="xl"
            onClick={() => navigate('/menu')}
            style={{ minWidth: '200px' }}
          >
            View Full Menu
          </Button>
        </Container>
      </Box>

        {/* Cart Drawer */}
        <CartDrawer open={cartDrawerOpen} onClose={handleCloseCart} onCheckout={handleCheckout} />
      </Box>
    </>
  );
};

export default PromotionsPage;
