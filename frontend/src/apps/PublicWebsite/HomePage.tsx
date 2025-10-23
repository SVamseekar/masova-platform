import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import StoreIcon from '@mui/icons-material/Store';
import HeroSection from './components/HeroSection';
import PromotionCard from './components/PromotionCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Featured promotions (top 3 for homepage)
  const featuredPromotions = [
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
    }
  ];

  // Why choose us features
  const features = [
    {
      icon: <RestaurantMenuIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Multi-Cuisine Menu',
      description: 'Pizzas, Biryani, Chinese, and more - something for everyone'
    },
    {
      icon: <DeliveryDiningIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Fast Delivery',
      description: 'Hot food delivered to your doorstep in 30 minutes or less'
    },
    {
      icon: <LocalOfferIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Great Offers',
      description: 'Weekly deals and combo offers to save you money'
    },
    {
      icon: <StoreIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Dine-In & Takeaway',
      description: 'Multiple ordering options - choose what works for you'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <HeroSection
        onOrderNow={() => navigate('/customer/menu')}
        onBrowseMenu={() => navigate('/menu')}
      />

      {/* Featured Promotions Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Today's Special Offers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Don't miss out on our amazing deals!
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/promotions')}
          >
            View All Offers
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {featuredPromotions.map((promo) => (
            <Grid item xs={12} md={4} key={promo.id}>
              <PromotionCard
                promotion={promo}
                onOrderNow={() => navigate('/customer/menu')}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Why Choose Us Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" align="center" gutterBottom>
            Why Choose MaSoVa?
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" mb={6}>
            We're committed to serving you the best food experience
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Box mb={2}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 6,
            textAlign: 'center'
          }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Hungry? Let's Order!
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Browse our menu and get your favorite food delivered in minutes
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
                px: 4,
                py: 1.5
              }}
              onClick={() => navigate('/customer/menu')}
            >
              Order Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                px: 4,
                py: 1.5
              }}
              onClick={() => navigate('/menu')}
            >
              Browse Menu
            </Button>
          </Stack>
        </Card>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                MaSoVa Restaurant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your favorite multi-cuisine restaurant serving delicious food since 2020
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Button sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/menu')}>
                  Browse Menu
                </Button>
                <Button sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/promotions')}>
                  Promotions
                </Button>
                <Button sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/login')}>
                  Staff Login
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: +91 9876543210
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: info@masova.com
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Address: Hyderabad, India
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 MaSoVa Restaurant Management System. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
