import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent, Grid, IconButton, Divider, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeFromCart, updateItemQuantity } from '../../store/slices/cartSlice';

interface CartPageProps {
  onContinueShopping: () => void;
  onProceedToPayment: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onContinueShopping, onProceedToPayment }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 29 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const handleRemove = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateItemQuantity({ id, quantity }));
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingBagIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" gutterBottom>Your Cart is Empty</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Looks like you haven't added anything to your cart yet
          </Typography>
          <Button variant="contained" size="large" onClick={onContinueShopping}>
            Browse Menu
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>Your Cart</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {cartItems.map((item) => (
              <Card key={item.id} elevation={2}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <Typography variant="h6" fontWeight="bold">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">�{item.price.toFixed(2)} each</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 2, minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={4} sm={3}>
                      <Typography variant="h6" fontWeight="bold" color="primary">�{(item.price * item.quantity).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={2} sm={1}>
                      <IconButton color="error" onClick={() => handleRemove(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>Order Summary</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>�{subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Delivery Fee</Typography>
                  <Typography>�{deliveryFee.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax (5%)</Typography>
                  <Typography>�{tax.toFixed(2)}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Total</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">�{total.toFixed(2)}</Typography>
              </Box>
              <Button variant="contained" fullWidth size="large" onClick={onProceedToPayment} sx={{ mb: 2 }}>
                Proceed to Payment
              </Button>
              <Button variant="outlined" fullWidth onClick={onContinueShopping}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage;
