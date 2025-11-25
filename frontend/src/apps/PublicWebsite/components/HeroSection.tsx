import React from 'react';
import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import IcecreamIcon from '@mui/icons-material/Icecream';
import { Button } from '../../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../../styles/design-tokens';

interface HeroSectionProps {
  onOrderNow: () => void;
  onBrowseMenu: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onOrderNow, onBrowseMenu }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Floating food icons for decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite'
        }}
      >
        <LocalPizzaIcon sx={{ fontSize: 120 }} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite'
        }}
      >
        <RamenDiningIcon sx={{ fontSize: 100 }} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite'
        }}
      >
        <IcecreamIcon sx={{ fontSize: 80 }} />
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Delicious Food, Delivered Fast
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  opacity: 0.95,
                  fontSize: { xs: '1.2rem', md: '1.5rem' }
                }}
              >
                Multi-cuisine restaurant with pizzas, biryani, Chinese & more
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                Order your favorite food from our extensive menu. We deliver hot and fresh meals
                to your doorstep in 30 minutes or less!
              </Typography>

              <div style={{ display: 'flex', flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="xl"
                  onClick={onOrderNow}
                  leftIcon={<RestaurantIcon />}
                  style={{
                    minWidth: '200px',
                    boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
                  }}
                >
                  Order Now
                </Button>
                <Button
                  variant="ghost"
                  size="xl"
                  onClick={onBrowseMenu}
                  style={{
                    minWidth: '200px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: colors.text.inverse,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  Browse Menu
                </Button>
              </div>

              {/* Quick stats */}
              <Stack
                direction="row"
                spacing={4}
                sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.3)' }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    100+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Menu Items
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    30min
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Delivery Time
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    10K+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Happy Customers
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: 'relative',
                display: { xs: 'none', md: 'block' }
              }}
            >
              {/* Placeholder for hero image - can be replaced with actual food image */}
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                <RestaurantIcon sx={{ fontSize: 150, opacity: 0.5 }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* CSS for floating animation */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default HeroSection;
