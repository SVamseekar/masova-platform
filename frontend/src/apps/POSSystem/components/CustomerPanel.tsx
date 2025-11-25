// src/apps/POSSystem/components/CustomerPanel.tsx
import React, { useState, useImperativeHandle } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
} from '@mui/icons-material';
import { useCreateOrderMutation } from '../../../store/api/orderApi';
import { useInitiatePaymentMutation, useVerifyPaymentMutation } from '../../../store/api/paymentApi';
import { CURRENCY, calculateOrderTotal, isValidPhoneNumber } from '../../../config/business-config';

interface CustomerPanelProps {
  items: any[];
  customer: any;
  onCustomerChange: (customer: any) => void;
  orderType: 'DINE_IN' | 'PICKUP' | 'DELIVERY';
  selectedTable?: string | null;
  onOrderComplete: () => void;
  userId?: string;
  storeId?: string;
  submitOrderRef?: React.MutableRefObject<(() => void) | null>;
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'WALLET'] as const;

const CustomerPanel: React.FC<CustomerPanelProps> = ({
  items,
  customer,
  onCustomerChange,
  orderType,
  selectedTable,
  onOrderComplete,
  userId,
  storeId,
  submitOrderRef,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>('CASH');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');

  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();
  const [initiatePayment] = useInitiatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = calculateOrderTotal(subtotal, orderType);

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value && !isValidPhoneNumber(value)) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('');
    }
  };

  // Expose handleSubmitOrder to parent via ref for keyboard shortcut
  useImperativeHandle(submitOrderRef, () => handleSubmitOrder, [
    items,
    customerName,
    customerPhone,
    deliveryAddress,
    orderType,
    selectedTable,
    paymentMethod,
    userId,
    storeId,
    customer,
  ]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate phone number if provided
    if (customerPhone && !isValidPhoneNumber(customerPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      isValid = false;
    }

    // Delivery must have address and phone
    if (orderType === 'DELIVERY') {
      if (!deliveryAddress.trim()) {
        setAddressError('Delivery address is required');
        isValid = false;
      }
      if (!customerPhone) {
        setPhoneError('Phone number is required for delivery');
        isValid = false;
      }
    }

    // Dine-in must have table number
    if (orderType === 'DINE_IN' && !selectedTable) {
      isValid = false;
    }

    return isValid;
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      alert('Please add items to the order');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!userId || !storeId) {
      alert('User or store information is missing. Please log in again.');
      return;
    }

    try {
      const orderData = {
        customerId: customer?.id || null,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        storeId,
        orderType,
        items,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING', // Will be updated after payment
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
        tableNumber: orderType === 'DINE_IN' ? selectedTable : null,
        specialInstructions: items
          .filter((item) => item.specialInstructions)
          .map((item) => `${item.name}: ${item.specialInstructions}`)
          .join('; '),
      };

      const result = await createOrder(orderData).unwrap();

      // For CASH payments, just complete the order
      if (paymentMethod === 'CASH') {
        alert(`Order #${result.orderNumber} created successfully! Payment: Cash on delivery/pickup`);
        resetForm();
        onOrderComplete();
        return;
      }

      // For online payments (CARD, UPI, WALLET), initiate Razorpay
      await handleOnlinePayment(result.id, result.orderNumber);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(`Failed to create order: ${error.message || 'Unknown error'}`);
    }
  };

  const handleOnlinePayment = async (orderId: string, orderNumber: string) => {
    try {
      // Initiate payment with Razorpay
      const paymentResponse = await initiatePayment({
        orderId,
        amount: total,
        customerId: customer?.id || 'walk-in',
        customerEmail: customer?.email || undefined,
        customerPhone: customerPhone || undefined,
        storeId: storeId!,
        notes: `POS Order #${orderNumber}`,
      }).unwrap();

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Configure Razorpay options
      const options = {
        key: paymentResponse.razorpayKeyId,
        amount: paymentResponse.amount,
        currency: paymentResponse.currency,
        name: 'MaSoVa Restaurant',
        description: `Order #${orderNumber}`,
        order_id: paymentResponse.razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: paymentMethod,
            }).unwrap();

            alert(`Order #${orderNumber} created and paid successfully!`);
            resetForm();
            onOrderComplete();
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            alert(`Payment verification failed: ${error.message || 'Unknown error'}\nOrder created but payment pending.`);
          }
        },
        prefill: {
          name: customerName || 'Customer',
          contact: customerPhone || '',
          email: customer?.email || '',
        },
        theme: {
          color: '#1976d2',
        },
        modal: {
          ondismiss: () => {
            alert(`Payment cancelled. Order #${orderNumber} created but payment is pending.`);
            onOrderComplete();
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      alert(`Failed to initiate payment: ${error.message || 'Unknown error'}\nPlease try again or use cash payment.`);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setPaymentMethod('CASH');
  };

  const canSubmit =
    items.length > 0 &&
    !isSubmitting &&
    !phoneError &&
    !addressError &&
    (orderType !== 'DINE_IN' || selectedTable);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Customer & Payment
        </Typography>
      </Box>

      {/* Form */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {/* Customer Information */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f9f9f9' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Customer Information
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Optional for walk-in"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            size="small"
            label="Phone Number"
            value={customerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="10-digit number"
            error={!!phoneError}
            helperText={phoneError}
            required={orderType === 'DELIVERY'}
            InputProps={{
              startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />

          {orderType === 'DELIVERY' && (
            <TextField
              fullWidth
              size="small"
              label="Delivery Address"
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                setAddressError('');
              }}
              placeholder="Enter complete delivery address"
              multiline
              rows={2}
              required
              error={!!addressError}
              helperText={addressError}
              InputProps={{
                startAdornment: <AddressIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
              }}
            />
          )}
        </Paper>

        {/* Payment Method */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f9f9f9' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            <PaymentIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1rem' }} />
            Payment Method
          </Typography>

          <ToggleButtonGroup
            value={paymentMethod}
            exclusive
            onChange={(_, value) => value && setPaymentMethod(value)}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          >
            {PAYMENT_METHODS.map((method) => (
              <ToggleButton key={method} value={method}>
                {method}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {paymentMethod === 'CASH' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Cash payment - collect at delivery/pickup
            </Alert>
          )}
        </Paper>

        {/* Order Summary */}
        {items.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Items:</Typography>
              <Typography variant="body2">{items.length}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Order Type:</Typography>
              <Typography variant="body2">{orderType.replace('_', ' ')}</Typography>
            </Box>
            {orderType === 'DINE_IN' && selectedTable && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Table:</Typography>
                <Typography variant="body2">#{selectedTable}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">
                Total Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {CURRENCY.format(total)}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Validation Warnings */}
        {items.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please add items to create an order
          </Alert>
        )}

        {orderType === 'DINE_IN' && !selectedTable && items.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please enter a table number
          </Alert>
        )}
      </Box>

      {/* Submit Button */}
      <Box sx={{ p: 2, borderTop: 2, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmitOrder}
          disabled={!canSubmit}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
          sx={{ py: 1.5 }}
        >
          {isSubmitting ? 'Processing...' : `Place Order - ${CURRENCY.format(total)}`}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          sx={{ mt: 1 }}
        >
          Press Ctrl+Enter to submit order
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomerPanel;
