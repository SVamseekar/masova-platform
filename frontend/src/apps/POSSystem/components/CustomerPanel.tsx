// src/apps/POSSystem/components/CustomerPanel.tsx
import React, { useState, useImperativeHandle } from 'react';
import { useCreateOrderMutation } from '../../../store/api/orderApi';
import { useInitiatePaymentMutation, useVerifyPaymentMutation } from '../../../store/api/paymentApi';
import { useGetOrCreateCustomerMutation } from '../../../store/api/customerApi';
import { CURRENCY, isValidPhoneNumber } from '../../../config/business-config';
import Card from '../../../components/ui/neumorphic/Card';
import Button from '../../../components/ui/neumorphic/Button';
import { colors, shadows, spacing, typography } from '../../../styles/design-tokens';
import { useGeocoding, buildAddressString } from '../../../hooks/useGeocoding';
import { PINAuthModal } from './PINAuthModal';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SyncIcon from '@mui/icons-material/Sync';

interface CustomerPanelProps {
  items: any[];
  customer: any;
  onCustomerChange: (customer: any) => void;
  orderType: 'PICKUP' | 'DELIVERY'; // Removed DINE_IN
  selectedTable?: string | null;
  onOrderComplete: () => void;
  userId?: string;
  storeId?: string;
  submitOrderRef?: React.MutableRefObject<(() => void) | null>;
  orderCreatedBy?: {
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  } | null;
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
  orderCreatedBy,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | undefined>();
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | undefined>();
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [specialInstructions, setSpecialInstructions] = useState('');
  // Default payment method: CASH for PICKUP, CARD for DELIVERY
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>(
    orderType === 'PICKUP' ? 'CASH' : 'CARD'
  );
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');

  // PIN Authentication for order submission
  const [showPINModal, setShowPINModal] = useState(false);
  const [authenticatedStaff, setAuthenticatedStaff] = useState<{
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  } | null>(null);

  // Geocoding hook
  const { geocode, loading: geocoding, error: geocodingError } = useGeocoding();

  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();
  const [initiatePayment] = useInitiatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [getOrCreateCustomer] = useGetOrCreateCustomerMutation();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% tax
  const deliveryFee = orderType === 'DELIVERY' && subtotal > 0 ? 40 : 0;
  const total = subtotal + tax + deliveryFee;

  // Update payment method when order type changes (PICKUP = CASH default, DELIVERY = CARD)
  React.useEffect(() => {
    // For DELIVERY, don't allow CASH - always use CARD
    if (orderType === 'DELIVERY') {
      setPaymentMethod('CARD');
    } else {
      // For PICKUP, default to CASH
      setPaymentMethod('CASH');
    }
  }, [orderType]);

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value && !isValidPhoneNumber(value)) {
      setPhoneError('Please enter a valid 10-digit phone number');
    } else {
      setPhoneError('');
    }
  };

  /**
   * Geocode delivery address when city or pincode is entered
   * This runs automatically when user tabs out of address fields
   */
  const handleAddressGeocode = async () => {
    if (orderType !== 'DELIVERY') return;

    // Need at least city and pincode for geocoding
    if (!deliveryCity.trim() || !deliveryPincode.trim()) {
      setGeocodingStatus('idle');
      return;
    }

    const fullAddress = buildAddressString(deliveryStreet, deliveryCity, undefined, deliveryPincode);

    console.log('🔍 Attempting to geocode:', fullAddress);

    const result = await geocode(fullAddress);

    if (result) {
      setDeliveryLatitude(result.latitude);
      setDeliveryLongitude(result.longitude);
      setGeocodingStatus('success');
      setAddressError('');
      console.log('✅ Geocoded successfully:', result.latitude, result.longitude);
    } else {
      setGeocodingStatus('error');
      setDeliveryLatitude(undefined);
      setDeliveryLongitude(undefined);
      // Don't set error - geocodingError from hook will be shown
    }
  };

  // Handler for PIN authentication completion
  const handlePINAuthenticated = (userData: { userId: string; name: string; type: string; role: string; storeId: string }) => {
    setAuthenticatedStaff(userData);
    setShowPINModal(false);
    // Proceed with order submission using authenticated staff
    submitOrderAfterAuth(userData);
  };

  // Handler for "Place Order" button click - opens PIN modal first
  const handlePlaceOrderClick = () => {
    if (items.length === 0) {
      alert('Please add items to the order');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Open PIN modal for authentication
    setShowPINModal(true);
  };

  // Expose handlePlaceOrderClick to parent via ref for keyboard shortcut
  useImperativeHandle(submitOrderRef, () => handlePlaceOrderClick, [
    items,
    customerName,
    customerEmail,
    customerPhone,
    deliveryStreet,
    deliveryCity,
    deliveryPincode,
    specialInstructions,
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

    // Validate email format if provided (for any payment method)
    if (customerEmail && customerEmail.trim() && !customerEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Require email for online payments (CARD/UPI/WALLET)
    if (paymentMethod !== 'CASH' && !customerEmail.trim()) {
      setEmailError('Email is required for online payments');
      isValid = false;
    }

    // Delivery must have complete address and phone
    if (orderType === 'DELIVERY') {
      if (!deliveryStreet.trim()) {
        setAddressError('Street address is required for delivery');
        isValid = false;
      }
      if (!deliveryCity.trim()) {
        setAddressError('City is required for delivery');
        isValid = false;
      }
      if (!deliveryPincode.trim()) {
        setAddressError('Pincode is required for delivery');
        isValid = false;
      }
      if (!customerPhone) {
        setPhoneError('Phone number is required for delivery');
        isValid = false;
      }
    }

    return isValid;
  };

  const submitOrderAfterAuth = async (staffData: { userId: string; name: string; type: string; role: string; storeId: string }) => {
    // Validation already done in handlePlaceOrderClick, proceed with order creation
    if (!storeId) {
      alert('Store information is missing. Please try again.');
      return;
    }

    try {
      // Step 1: Create/get customer profile if we have customer details
      let customerProfileId = customer?.id;

      if (!customerProfileId && (customerPhone || customerEmail)) {
        try {
          // Generate a temporary userId for walk-in customers using phone or email
          const tempUserId = customerPhone
            ? `walkin-phone-${customerPhone.replace(/\D/g, '')}`
            : `walkin-email-${customerEmail.replace(/[^a-zA-Z0-9]/g, '')}`;

          const customerProfile = await getOrCreateCustomer({
            userId: tempUserId,
            storeId: storeId!,
            name: customerName.trim() || 'Walk-in Customer',
            email: customerEmail || `${tempUserId}@walkin.local`,
            phone: customerPhone || '0000000000',
            marketingOptIn: false,
            smsOptIn: false,
          }).unwrap();

          customerProfileId = customerProfile.id;
          console.log('Customer profile created/retrieved:', customerProfileId);
        } catch (error) {
          console.warn('Failed to create customer profile, continuing without it:', error);
          // Continue without customer profile - order will still work
        }
      }

      // Step 2: Transform items to match backend expectations
      const transformedItems = items.map((item) => ({
        menuItemId: item.menuItemId || item.id, // Use menuItemId if available, fallback to id
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant,
        customizations: item.customizations,
      }));

      // Parse delivery address if provided - NOW WITH GEOCODED COORDINATES!
      let parsedDeliveryAddress = null;
      if (orderType === 'DELIVERY' && deliveryStreet) {
        parsedDeliveryAddress = {
          street: deliveryStreet,
          city: deliveryCity,
          pincode: deliveryPincode,
          latitude: deliveryLatitude,  // From geocoding
          longitude: deliveryLongitude // From geocoding
        };

        // Log for debugging
        if (deliveryLatitude && deliveryLongitude) {
          console.log('✅ Order includes GPS coordinates:', deliveryLatitude, deliveryLongitude);
        } else {
          console.warn('⚠️ Order missing GPS coordinates - dispatch may use mock coordinates in test mode');
        }
      }

      // Transform orderType from PICKUP to TAKEAWAY for backend
      const backendOrderType = orderType === 'PICKUP' ? 'TAKEAWAY' : orderType;

      const orderData = {
        customerId: customerProfileId || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail.trim() || undefined, // For email notifications
        storeId,
        orderType: backendOrderType as 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY',
        items: transformedItems,
        paymentMethod,
        deliveryAddress: parsedDeliveryAddress || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        // Staff tracking - who created this order (from PIN authentication)
        createdByStaffId: staffData.userId,
        createdByStaffName: staffData.name,
      };

      // Step 3: Create the order
      const result = await createOrder(orderData).unwrap();

      // For CASH payments, just create the order with PENDING status
      // Staff will mark as paid after collecting cash
      if (paymentMethod === 'CASH') {
        alert(
          `Order #${result.orderNumber} created successfully!\n\n` +
          `Payment Method: CASH\n` +
          `Amount: ${CURRENCY.format(total)}\n\n` +
          `Remember to collect cash and mark as paid in Order Management!`
        );
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
      // Transform orderType from PICKUP to TAKEAWAY for backend
      const backendOrderType = orderType === 'PICKUP' ? 'TAKEAWAY' : orderType;

      // Initiate payment with Razorpay
      const paymentResponse = await initiatePayment({
        orderId,
        amount: total,
        customerId: customer?.id || 'walk-in',
        customerEmail: customerEmail || customer?.email || undefined,
        customerPhone: customerPhone || undefined,
        storeId: storeId!,
        orderType: backendOrderType, // For payment analytics
        paymentMethod: paymentMethod, // For payment analytics
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
        key: paymentResponse.razorpayKeyId || '',
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
          color: colors.brand.primary,
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
    setCustomerEmail('');
    setCustomerPhone('');
    setDeliveryStreet('');
    setDeliveryCity('');
    setDeliveryPincode('');
    setSpecialInstructions('');
    setPaymentMethod(orderType === 'PICKUP' ? 'CASH' : 'CARD');
  };

  const canSubmit =
    items.length > 0 &&
    !isSubmitting &&
    !phoneError &&
    !addressError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: spacing[3],
        borderBottom: `2px solid ${colors.surface.border}`,
        background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`
      }}>
        <h3 style={{
          margin: 0,
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2]
        }}>
          <PersonIcon style={{ fontSize: '20px', color: colors.brand.primary }} />
          Customer & Payment
        </h3>
      </div>

      {/* Form */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: spacing[4],
        paddingBottom: spacing[6] // Extra padding at bottom to ensure last elements are visible
      }}>
        {/* Customer Information */}
        <Card
          elevation="sm"
          padding="lg"
          style={{
            marginBottom: spacing[4],
            backgroundColor: colors.surface.secondary,
            border: `1px solid ${colors.surface.border}`
          }}
        >
          <p style={{
            margin: `0 0 ${spacing[4]} 0`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary
          }}>
            <AssignmentIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
            Customer Information
          </p>

          <input
            type="text"
            placeholder="Customer Name (optional for walk-in)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{
              width: '100%',
              padding: spacing[3],
              marginBottom: spacing[3],
              border: `2px solid ${colors.surface.border}`,
              borderRadius: '10px',
              outline: 'none',
              backgroundColor: colors.surface.primary,
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.primary,
              boxShadow: shadows.inset.sm,
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.brand.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.brand.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.surface.border;
              e.currentTarget.style.boxShadow = shadows.inset.sm;
            }}
          />

          <input
            type="tel"
            placeholder={`Phone Number ${orderType === 'DELIVERY' ? '(required)' : ''}`}
            value={customerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            style={{
              width: '100%',
              padding: spacing[3],
              marginBottom: phoneError ? spacing[1] : spacing[3],
              border: `2px solid ${phoneError ? colors.semantic.error : colors.surface.border}`,
              borderRadius: '10px',
              outline: 'none',
              backgroundColor: colors.surface.primary,
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.primary,
              boxShadow: shadows.inset.sm,
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = phoneError ? colors.semantic.error : colors.brand.primary;
              e.currentTarget.style.boxShadow = phoneError
                ? `0 0 0 3px ${colors.semantic.error}22`
                : `0 0 0 3px ${colors.brand.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = phoneError ? colors.semantic.error : colors.surface.border;
              e.currentTarget.style.boxShadow = shadows.inset.sm;
            }}
          />
          {phoneError && (
            <p style={{
              margin: `0 0 ${spacing[3]} 0`,
              fontSize: typography.fontSize.xs,
              color: colors.semantic.error
            }}>
              <WarningAmberIcon style={{ fontSize: '12px', marginRight: '4px', verticalAlign: 'middle' }} />{phoneError}
            </p>
          )}

          {/* Email field - optional for all orders, required for online payments */}
          <input
            type="email"
            placeholder={paymentMethod === 'CASH' ? "Email (optional - for order notifications)" : "Email (for payment receipt & notifications)"}
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              setEmailError('');
            }}
            style={{
                  width: '100%',
                  padding: spacing[3],
                  marginBottom: emailError ? spacing[1] : spacing[3],
                  border: `2px solid ${emailError ? colors.semantic.error : colors.surface.border}`,
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: colors.surface.primary,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.primary,
                  boxShadow: shadows.inset.sm,
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = emailError ? colors.semantic.error : colors.brand.primary;
                  e.currentTarget.style.boxShadow = emailError
                    ? `0 0 0 3px ${colors.semantic.error}22`
                    : `0 0 0 3px ${colors.brand.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = emailError ? colors.semantic.error : colors.surface.border;
                  e.currentTarget.style.boxShadow = shadows.inset.sm;
                }}
              />
          {emailError && (
            <p style={{
              margin: `0 0 ${spacing[3]} 0`,
              fontSize: typography.fontSize.xs,
              color: colors.semantic.error
            }}>
              <WarningAmberIcon style={{ fontSize: '12px', marginRight: '4px', verticalAlign: 'middle' }} />{emailError}
            </p>
          )}

          {/* Delivery Address Fields */}
          {orderType === 'DELIVERY' && (
            <>
              <input
                type="text"
                placeholder="Street Address (required)"
                value={deliveryStreet}
                onChange={(e) => {
                  setDeliveryStreet(e.target.value);
                  setAddressError('');
                }}
                style={{
                  width: '100%',
                  padding: spacing[3],
                  marginBottom: spacing[3],
                  border: `2px solid ${addressError ? colors.semantic.error : colors.surface.border}`,
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: colors.surface.primary,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.primary,
                  boxShadow: shadows.inset.sm,
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.brand.primary;
                  e.currentTarget.style.boxShadow = addressError
                    ? `0 0 0 3px ${colors.semantic.error}22`
                    : `0 0 0 3px ${colors.brand.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.surface.border;
                  e.currentTarget.style.boxShadow = shadows.inset.sm;
                }}
              />

              <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
                <input
                  type="text"
                  placeholder="City (required)"
                  value={deliveryCity}
                  onChange={(e) => {
                    setDeliveryCity(e.target.value);
                    setAddressError('');
                  }}
                  style={{
                    flex: 1,
                    padding: spacing[3],
                    border: `2px solid ${addressError ? colors.semantic.error : colors.surface.border}`,
                    borderRadius: '10px',
                    outline: 'none',
                    backgroundColor: colors.surface.primary,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.primary,
                    boxShadow: shadows.inset.sm,
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.brand.primary;
                    e.currentTarget.style.boxShadow = addressError
                      ? `0 0 0 3px ${colors.semantic.error}22`
                      : `0 0 0 3px ${colors.brand.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.surface.border;
                    e.currentTarget.style.boxShadow = shadows.inset.sm;
                  }}
                />

                <input
                  type="text"
                  placeholder="Pincode (required)"
                  value={deliveryPincode}
                  onChange={(e) => {
                    setDeliveryPincode(e.target.value);
                    setAddressError('');
                  }}
                  maxLength={6}
                  style={{
                    width: '140px',
                    padding: spacing[3],
                    border: `2px solid ${addressError ? colors.semantic.error : colors.surface.border}`,
                    borderRadius: '10px',
                    outline: 'none',
                    backgroundColor: colors.surface.primary,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.primary,
                    boxShadow: shadows.inset.sm,
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.brand.primary;
                    e.currentTarget.style.boxShadow = addressError
                      ? `0 0 0 3px ${colors.semantic.error}22`
                      : `0 0 0 3px ${colors.brand.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = addressError ? colors.semantic.error : colors.surface.border;
                    e.currentTarget.style.boxShadow = shadows.inset.sm;
                    // Trigger geocoding when user leaves pincode field
                    handleAddressGeocode();
                  }}
                />
              </div>

              {/* Geocoding status indicator */}
              {orderType === 'DELIVERY' && (deliveryCity || deliveryPincode) && (
                <div style={{
                  marginBottom: spacing[3],
                  padding: spacing[2],
                  borderRadius: '8px',
                  fontSize: typography.fontSize.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  backgroundColor: geocodingStatus === 'success'
                    ? `${colors.semantic.success}15`
                    : geocodingStatus === 'error'
                    ? `${colors.semantic.error}15`
                    : `${colors.semantic.info}15`,
                  color: geocodingStatus === 'success'
                    ? colors.semantic.success
                    : geocodingStatus === 'error'
                    ? colors.semantic.error
                    : colors.semantic.info
                }}>
                  {geocoding && <span><SyncIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />Finding location...</span>}
                  {!geocoding && geocodingStatus === 'success' && deliveryLatitude && (
                    <span>
                      <CheckCircleOutlineIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />Location found: {deliveryLatitude.toFixed(4)}, {deliveryLongitude?.toFixed(4)}
                    </span>
                  )}
                  {!geocoding && geocodingStatus === 'error' && (
                    <span><WarningAmberIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />{geocodingError || 'Could not find location - will use test coordinates in dev mode'}</span>
                  )}
                  {!geocoding && geocodingStatus === 'idle' && (
                    <span><LocationOnIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />Enter city & pincode to find GPS coordinates</span>
                  )}
                </div>
              )}

              <textarea
                placeholder="Special instructions (optional)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: spacing[3],
                  marginBottom: addressError ? spacing[1] : 0,
                  border: `2px solid ${colors.surface.border}`,
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: colors.surface.primary,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.primary,
                  boxShadow: shadows.inset.sm,
                  resize: 'vertical',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.brand.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.surface.border;
                  e.currentTarget.style.boxShadow = shadows.inset.sm;
                }}
              />

              {addressError && (
                <p style={{
                  margin: 0,
                  fontSize: typography.fontSize.xs,
                  color: colors.semantic.error
                }}>
                  <WarningAmberIcon style={{ fontSize: '12px', marginRight: '4px', verticalAlign: 'middle' }} />{addressError}
                </p>
              )}
            </>
          )}
        </Card>

        {/* Payment Method */}
        <Card
          elevation="sm"
          padding="lg"
          style={{
            marginBottom: spacing[4],
            backgroundColor: colors.surface.secondary,
            border: `1px solid ${colors.surface.border}`
          }}
        >
          <p style={{
            margin: `0 0 ${spacing[3]} 0`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary
          }}>
            <PaymentIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
            Payment Method
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: spacing[2],
            marginBottom: paymentMethod === 'CASH' ? spacing[3] : 0
          }}>
            {PAYMENT_METHODS
              .filter(method => {
                // Hide CASH option for DELIVERY orders
                if (orderType === 'DELIVERY' && method === 'CASH') {
                  return false;
                }
                return true;
              })
              .map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  padding: spacing[3],
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.primary,
                  transition: 'all 0.2s ease',
                  ...(paymentMethod === method ? {
                    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                    color: colors.text.inverse,
                    boxShadow: shadows.floating.md
                  } : {
                    background: colors.surface.primary,
                    color: colors.text.secondary,
                    boxShadow: shadows.raised.sm
                  })
                }}
                onMouseEnter={(e) => {
                  if (paymentMethod !== method) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = shadows.floating.sm;
                  }
                }}
                onMouseLeave={(e) => {
                  if (paymentMethod !== method) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.raised.sm;
                  }
                }}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'CASH' && (
            <div style={{
              padding: spacing[3],
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${colors.semantic.infoLight}22 0%, ${colors.semantic.info}11 100%)`,
              border: `2px solid ${colors.semantic.info}`,
              fontSize: typography.fontSize.xs,
              color: colors.text.primary
            }}>
              Cash payment - collect at delivery/pickup
            </div>
          )}
        </Card>

        {/* Order Summary */}
        {items.length > 0 && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.successLight}22 0%, ${colors.semantic.success}11 100%)`,
              border: `2px solid ${colors.semantic.success}`
            }}
          >
            <p style={{
              margin: `0 0 ${spacing[3]} 0`,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary
            }}>
              <CheckCircleOutlineIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle', color: colors.semantic.success }} />
              Order Summary
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              <span>Items:</span>
              <span style={{ fontWeight: typography.fontWeight.semibold }}>{items.length}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              <span>Order Type:</span>
              <span style={{ fontWeight: typography.fontWeight.semibold }}>{orderType.replace('_', ' ')}</span>
            </div>
            <div style={{
              height: '1px',
              background: colors.surface.border,
              margin: `${spacing[3]} 0`
            }} />

            {/* Pricing Breakdown */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {CURRENCY.format(subtotal)}
              </span>
            </div>

            {orderType === 'DELIVERY' && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                <span>Delivery Fee:</span>
                <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                  {CURRENCY.format(deliveryFee)}
                </span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing[3],
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              <span>Tax (5%):</span>
              <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {CURRENCY.format(tax)}
              </span>
            </div>

            <div style={{
              height: '2px',
              background: colors.surface.border,
              margin: `${spacing[2]} 0`
            }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.extrabold,
                color: colors.text.primary
              }}>
                Total Amount:
              </span>
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.extrabold,
                color: colors.semantic.success
              }}>
                {CURRENCY.format(total)}
              </span>
            </div>
          </Card>
        )}

        {/* Validation Warnings */}
        {items.length === 0 && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              marginTop: spacing[4],
              background: `linear-gradient(135deg, ${colors.semantic.warningLight}22 0%, ${colors.semantic.warning}11 100%)`,
              border: `2px solid ${colors.semantic.warning}`,
              textAlign: 'center'
            }}
          >
            <WarningAmberIcon style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
            Please add items to create an order
          </Card>
        )}

        {/* Place Order Button - At the end of scrollable content */}
        <div style={{ marginTop: spacing[4] }}>
          <button
            onClick={handlePlaceOrderClick}
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: `${spacing[4]} ${spacing[5]}`,
              borderRadius: '12px',
              border: `2px solid ${canSubmit ? colors.semantic.success : colors.surface.border}`,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.extrabold,
              fontFamily: typography.fontFamily.primary,
              color: canSubmit ? '#FFFFFF' : colors.text.tertiary,
              background: canSubmit
                ? `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successDark} 100%)`
                : colors.surface.secondary,
              boxShadow: canSubmit ? shadows.floating.lg : shadows.inset.sm,
              transition: 'all 0.3s ease',
              opacity: canSubmit ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (canSubmit && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.floating.xl;
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = shadows.floating.lg;
              }
            }}
            onMouseDown={(e) => {
              if (canSubmit && !isSubmitting) {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.boxShadow = shadows.inset.md;
              }
            }}
            onMouseUp={(e) => {
              if (canSubmit && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.floating.xl;
              }
            }}
          >
            {isSubmitting ? 'Processing...' : `Place Order - ${CURRENCY.format(total)}`}
          </button>
        </div>

        {/* PIN Authentication Modal */}
        <PINAuthModal
          isOpen={showPINModal}
          onClose={() => setShowPINModal(false)}
          onAuthenticated={handlePINAuthenticated}
        />
      </div>
    </div>
  );
};

export default CustomerPanel;
