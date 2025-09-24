import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Badge,
  IconButton,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Restaurant as RestaurantIcon,
  LocalPizza as PizzaIcon,
  Fastfood as FastfoodIcon,
  LocalDrink as DrinkIcon,
  Payment as PaymentIcon,
  TrackChanges as TrackIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addToCart, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { formatINR } from '../../utils/currency';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'PIZZA' | 'SIDES' | 'DRINKS';
  image: string;
  description: string;
  isVegetarian?: boolean;
  isAvailable?: boolean;
}

const CustomerApp: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: cartItems, total } = useAppSelector(state => state.cart);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const mockMenuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      price: 299,
      category: 'PIZZA',
      image: '/api/placeholder/300/200',
      description: 'Fresh tomato sauce, mozzarella cheese, fresh basil',
      isVegetarian: true,
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Pepperoni Pizza',
      price: 399,
      category: 'PIZZA',
      image: '/api/placeholder/300/200',
      description: 'Pepperoni, mozzarella cheese, tomato sauce',
      isVegetarian: false,
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Veggie Supreme',
      price: 449,
      category: 'PIZZA',
      image: '/api/placeholder/300/200',
      description: 'Bell peppers, onions, mushrooms, olives, tomatoes',
      isVegetarian: true,
      isAvailable: true,
    },
    {
      id: '4',
      name: 'Garlic Bread',
      price: 149,
      category: 'SIDES',
      image: '/api/placeholder/300/200',
      description: 'Fresh baked bread with garlic butter and herbs',
      isVegetarian: true,
      isAvailable: true,
    },
    {
      id: '5',
      name: 'Coke 330ml',
      price: 49,
      category: 'DRINKS',
      image: '/api/placeholder/300/200',
      description: 'Refreshing cola drink',
      isVegetarian: true,
      isAvailable: true,
    },
  ];

  const handleAddToCart = (item: MenuItem) => {
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
    }));
  };

  const MenuPage = () => (
    <Container maxWidth="lg" sx={{ mt: 2, pb: 10 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Our Delicious Menu
      </Typography>

      {/* Category Filter Chips */}
      <Box display="flex" justifyContent="center" gap={2} mb={4} flexWrap="wrap">
        {['ALL', 'PIZZA', 'SIDES', 'DRINKS'].map((category) => (
          <Chip
            key={category}
            label={category}
            variant="outlined"
            color="primary"
            icon={
              category === 'PIZZA' ? <PizzaIcon /> :
              category === 'SIDES' ? <FastfoodIcon /> :
              category === 'DRINKS' ? <DrinkIcon /> : <RestaurantIcon />
            }
            sx={{ 
              fontSize: '0.9rem', 
              fontWeight: 600,
              '&:hover': { backgroundColor: 'primary.light', color: 'white' }
            }}
          />
        ))}
      </Box>

      {/* Menu Items Grid */}
      <Grid container spacing={3}>
        {mockMenuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.image}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" component="h3" fontWeight="bold">
                    {item.name}
                  </Typography>
                  {item.isVegetarian && (
                    <Chip 
                      label="Veg" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatINR(item.price)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.isAvailable}
                >
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <Fab
          color="primary"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: 1000
          }}
          onClick={() => setCartDrawerOpen(true)}
        >
          <Badge badgeContent={cartItems.length} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}
    </Container>
  );

  const OrderTrackingPage = () => {
    const steps = [
      'Order Confirmed',
      'Preparing Your Food',
      'In the Oven',
      'Out for Delivery',
      'Delivered'
    ];
    
    const activeStep = 2; // Mock active step

    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Order Tracking
          </Typography>
          
          <Box textAlign="center" mb={4}>
            <Typography variant="h6" color="primary" gutterBottom>
              Order #1245
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Estimated delivery: 25 minutes
            </Typography>
          </Box>

          <Box mb={4}>
            <LinearProgress 
              variant="determinate" 
              value={(activeStep / (steps.length - 1)) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {index <= activeStep ? 'Completed' : 'Pending'}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper variant="outlined" sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Address:</strong> Banjara Hills, Hyderabad, Telangana
            </Typography>
            <Typography variant="body2">
              <strong>Contact:</strong> +91 98765 43210
            </Typography>
          </Paper>
        </Paper>
      </Container>
    );
  };

  // Cart Drawer Component
  const CartDrawer = () => (
    <Drawer
      anchor="right"
      open={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Your Cart ({cartItems.length} items)
        </Typography>
        <Divider />
        
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {cartItems.map((item, index) => (
            <ListItem key={`${item.id}-${index}`} divider>
              <ListItemText
                primary={item.name}
                secondary={`Quantity: ${item.quantity}`}
              />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {formatINR(item.price * item.quantity)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <IconButton 
                    size="small" 
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="body2" mx={1}>
                    {item.quantity}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleAddToCart(item as any)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>

        <Box sx={{ pt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatINR(total)}
            </Typography>
          </Box>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={() => {
              setCartDrawerOpen(false);
              navigate('/customer/checkout');
            }}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <PizzaIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Domino's Pizza
          </Typography>
          <IconButton color="primary" onClick={() => setCartDrawerOpen(true)}>
            <Badge badgeContent={cartItems.length} color="error">
              <CartIcon />
            </Badge>
          </IconButton>
          <IconButton color="primary">
            <PersonIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="menu" replace />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="tracking" element={<OrderTrackingPage />} />
      </Routes>

      {/* Cart Drawer */}
      <CartDrawer />
    </Box>
  );
};

export default CustomerApp;