import React, { useState } from 'react';
import { Container, Typography, Box, Button, Card, CardContent, Grid, Radio, RadioGroup, FormControlLabel, FormControl, TextField, Divider, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useCreateOrderMutation } from '../../store/api/orderApi';
import { clearCart } from '../../store/slices/cartSlice';

interface PaymentPageProps {
  onBack: () => void;
  onComplete: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, onComplete }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const currentUser = useAppSelector(state => state.auth.user);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DELIVERY');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    pincode: ''
  });

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = orderType === 'DELIVERY' ? 29 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    try {
      await createOrder({
        storeId: 'store-1', // Default store
        customerName,
        customerPhone,
        customerId: currentUser?.userId,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.price * 100), // Convert to paise
          variant: item.variant,
          customizations: item.customizations
        })),
        orderType,
        paymentMethod: paymentMethod as any,
        deliveryAddress: orderType === 'DELIVERY' ? address : undefined,
      }).unwrap();

      dispatch(clearCart());
      onComplete();
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>Payment & Checkout</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Customer Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Customer Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Type */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Order Type</Typography>
              <FormControl component="fieldset">
                <RadioGroup value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
                  <FormControlLabel value="DELIVERY" control={<Radio />} label="Delivery" />
                  <FormControlLabel value="TAKEAWAY" control={<Radio />} label="Takeaway" />
                  <FormControlLabel value="DINE_IN" control={<Radio />} label="Dine In" />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {orderType === 'DELIVERY' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Delivery Address</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Street Address" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="City" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Pincode" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} required />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Payment Method</Typography>
              <FormControl component="fieldset">
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <FormControlLabel value="CASH" control={<Radio />} label="Cash on Delivery" />
                  <FormControlLabel value="CARD" control={<Radio />} label="Credit/Debit Card" />
                  <FormControlLabel value="UPI" control={<Radio />} label="UPI" />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to place order. Please try again.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>Order Summary</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal ({cartItems.length} items)</Typography>
                  <Typography>₹{subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Delivery Fee</Typography>
                  <Typography>₹{deliveryFee.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax (5%)</Typography>
                  <Typography>₹{tax.toFixed(2)}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Total</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">₹{total.toFixed(2)}</Typography>
              </Box>
              <Button variant="contained" fullWidth size="large" onClick={handlePlaceOrder} disabled={isLoading || !customerName || !customerPhone} sx={{ mb: 2 }}>
                {isLoading ? 'Placing Order...' : 'Place Order'}
              </Button>
              <Button variant="outlined" fullWidth onClick={onBack}>Back to Cart</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentPage;
