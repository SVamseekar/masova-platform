import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import CustomerPageHeader from '../../components/common/CustomerPageHeader';
import { useCreateOrderMutation } from '../../store/api/orderApi';
import { useInitiatePaymentMutation } from '../../store/api/paymentApi';
import { useGetCustomerByUserIdQuery, useGetOrCreateCustomerMutation } from '../../store/api/customerApi';
import { useCheckDeliveryRadiusQuery } from '../../store/api/storeApi';
import { selectCartItems, selectCartSubtotal, selectDeliveryFee, selectSelectedStoreId } from '../../store/slices/cartSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors } from '../../styles/design-tokens';

// Razorpay is declared in types/razorpay.d.ts - no need to redeclare

interface GuestInfo {
  email: string;
  phone: string;
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const baseDeliveryFee = useAppSelector(selectDeliveryFee);
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);

  // Get guest info from navigation state (passed from GuestCheckoutPage)
  const guestInfo = location.state?.guestInfo as GuestInfo | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CARD');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
  const [getOrCreateCustomer] = useGetOrCreateCustomerMutation();

  const { data: customerProfile } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  // Get selected address object for radius check
  const selectedAddress = customerProfile?.addresses?.find(a => a.id === selectedAddressId) ?? null;
  const selectedLat = selectedAddress?.latitude ?? null;
  const selectedLng = selectedAddress?.longitude ?? null;

  useEffect(() => {
    if (customerProfile?.addresses && customerProfile.addresses.length > 0) {
      const defaultAddress = customerProfile.addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(customerProfile.addresses[0].id);
      }
    }
  }, [customerProfile]);

  const { data: radiusCheck } = useCheckDeliveryRadiusQuery(
    {
      storeId: selectedStoreId || '',
      latitude: selectedLat ?? 0,
      longitude: selectedLng ?? 0,
    },
    {
      skip:
        orderType !== 'DELIVERY' ||
        !selectedStoreId ||
        selectedLat === null ||
        selectedLng === null,
    }
  );

  const isOutsideDeliveryRadius =
    orderType === 'DELIVERY' &&
    selectedLat !== null &&
    selectedLng !== null &&
    radiusCheck !== undefined &&
    radiusCheck.withinRadius === false;

  const isLoading = isCreatingOrder || isInitiatingPayment;
  const [orderPlaced, setOrderPlaced] = React.useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/menu');
    }
  }, [cartItems, navigate, orderPlaced]);

  useEffect(() => {
    if (orderType === 'DELIVERY' && paymentMethod === 'CASH') {
      setPaymentMethod('CARD');
    }
  }, [orderType, paymentMethod]);

  const deliveryFee = orderType === 'DELIVERY' ? baseDeliveryFee : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    try {
      let customerId = customerProfile?.id;
      if (currentUser && !customerId) {
        try {
          const phoneToUse = currentUser.phone || guestInfo?.phone || '';
          const cleanPhone = phoneToUse.replace(/\D/g, '');
          const customer = await getOrCreateCustomer({
            userId: currentUser.id,
            storeId: selectedStoreId || undefined,
            name: currentUser.name,
            email: currentUser.email || '',
            phone: cleanPhone,
          }).unwrap();
          customerId = customer.id;
        } catch (err: any) {
          const errorMessage = err?.data?.message || 'Unable to retrieve customer profile';
          alert(`Unable to retrieve your customer profile. Please try again or contact support.\n\nError: ${errorMessage}`);
          return;
        }
      }

      if (currentUser && !customerId) {
        alert('Unable to retrieve your customer information. Please refresh the page and try again.');
        return;
      }

      let deliveryAddress = undefined;
      let specialInstructions = undefined;

      if (orderType === 'DELIVERY') {
        if (guestInfo) {
          deliveryAddress = {
            street: guestInfo.street,
            city: guestInfo.city,
            state: guestInfo.state,
            pincode: guestInfo.pincode,
            landmark: guestInfo.deliveryInstructions || '',
          };
          specialInstructions = guestInfo.deliveryInstructions;
        } else if (customerProfile && selectedAddressId) {
          const selectedAddress = customerProfile.addresses.find(addr => addr.id === selectedAddressId);
          if (selectedAddress) {
            deliveryAddress = {
              street: selectedAddress.addressLine1 + (selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''),
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.postalCode,
              landmark: selectedAddress.landmark || '',
            };
          }
        }
      }

      const orderData = {
        storeId: selectedStoreId || currentUser?.storeId || '',
        customerName: currentUser?.name || guestInfo?.name || 'Guest',
        customerPhone: guestInfo?.phone || currentUser?.phone || '',
        customerEmail: currentUser?.email || guestInfo?.email || '',
        customerId: customerId,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant: (item as any).variant,
          customizations: (item as any).customizations,
        })),
        orderType,
        paymentMethod,
        deliveryAddress,
        specialInstructions,
      };

      const orderResult = await createOrder(orderData).unwrap();
      const orderId = orderResult.id;

      if (paymentMethod === 'CASH') {
        setOrderPlaced(true);
        navigate(`/tracking/${orderId}`, {
          state: { orderData: orderResult },
          replace: true,
        });
        return;
      }

      const paymentResult = await initiatePayment({
        orderId: orderId,
        amount: orderResult.total,
        customerId: currentUser?.id || 'guest',
        customerEmail: guestInfo?.email || currentUser?.email,
        customerPhone: guestInfo?.phone || currentUser?.phone,
        storeId: selectedStoreId || currentUser?.storeId || '',
        orderType: orderType,
        paymentMethod: paymentMethod,
      }).unwrap();

      openRazorpayCheckout(paymentResult, orderId);

    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to create order. Please try again.';
      alert(errorMessage);
    }
  };

  const openRazorpayCheckout = (paymentData: any, orderId: string) => {
    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded. Please refresh the page.');
      return;
    }

    const options = {
      key: paymentData.razorpayKeyId,
      amount: paymentData.amount * 100,
      currency: 'INR',
      name: 'MaSoVa Restaurant',
      description: `Order #${orderId}`,
      order_id: paymentData.razorpayOrderId,
      handler: function (response: any) {
        setOrderPlaced(true);
        navigate(`/payment/success?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}&order_id=${orderId}`);
      },
      prefill: {
        name: guestInfo?.name || currentUser?.name || '',
        email: guestInfo?.email || currentUser?.email || '',
        contact: guestInfo?.phone || currentUser?.phone || '',
      },
      notes: { order_id: orderId },
      theme: { color: colors.brand.primary },
      modal: {
        ondismiss: function() {
          navigate(`/payment/failed?order_id=${orderId}&error=Payment cancelled by user`);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response: any) {
      navigate(`/payment/failed?order_id=${orderId}&error=${response.error.description || 'Payment failed'}`);
    });
    razorpay.open();
  };

  const isPlaceOrderDisabled = isLoading || (orderType === 'DELIVERY' && !guestInfo && (!customerProfile || !selectedAddressId)) || isOutsideDeliveryRadius;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <CustomerPageHeader onBack={() => navigate('/checkout')} breadcrumb="Checkout" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Page title */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
              Complete Your Order
            </h1>
            <div style={{ height: '2px', width: '60px', background: 'var(--gold)', marginTop: '10px', borderRadius: '2px' }} />
          </div>

          {/* Guest delivery info */}
          {guestInfo && (
            <div style={cardStyle}>
              <SectionLabel>Delivery Information</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <InfoRow label="Name" value={guestInfo.name} />
                <InfoRow label="Email" value={guestInfo.email} />
                <InfoRow label="Phone" value={guestInfo.phone} />
                <InfoRow label="Address" value={`${guestInfo.street}, ${guestInfo.city}, ${guestInfo.state} — ${guestInfo.pincode}`} />
                {guestInfo.deliveryInstructions && (
                  <InfoRow label="Instructions" value={guestInfo.deliveryInstructions} />
                )}
              </div>
            </div>
          )}

          {/* Logged-in customer info + address */}
          {currentUser && !guestInfo && customerProfile && (
            <div style={cardStyle}>
              <SectionLabel>Customer Information</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: orderType === 'DELIVERY' ? '20px' : '0' }}>
                <InfoRow label="Name" value={currentUser.name} />
                <InfoRow label="Email" value={currentUser.email || ''} />
                <InfoRow label="Phone" value={currentUser.phone || ''} />
              </div>

              {orderType === 'DELIVERY' && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />
                  <SectionLabel>Delivery Address</SectionLabel>
                  {customerProfile.addresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customerProfile.addresses.map((address) => {
                        const isSelected = selectedAddressId === address.id;
                        return (
                          <div
                            key={address.id}
                            onClick={() => setSelectedAddressId(address.id)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                              background: isSelected ? 'rgba(212,175,55,0.07)' : 'var(--surface-2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: isSelected ? '4px solid var(--gold)' : '2px solid var(--text-3)',
                                flexShrink: 0,
                              }} />
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '1px 6px', borderRadius: '20px' }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', paddingLeft: '24px', lineHeight: 1.6 }}>
                              {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                              {address.city}, {address.state} — {address.postalCode}
                              {address.landmark && <><br />Landmark: {address.landmark}</>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      No saved addresses. Add one from your profile page.
                    </div>
                  )}
                  {isOutsideDeliveryRadius && (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: '#856404',
                      fontSize: '14px',
                      marginTop: '8px',
                    }}>
                      &#9888; Your delivery address is outside this store's delivery area ({radiusCheck?.deliveryRadiusKm} km radius).
                      Please choose a closer address or switch to Takeaway.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Order Type */}
          <div style={cardStyle}>
            <SectionLabel>Order Type</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <OrderTypeCard
                active={orderType === 'DELIVERY'}
                onClick={() => setOrderType('DELIVERY')}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                    <rect x="9" y="11" width="14" height="10" rx="2" />
                    <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  </svg>
                }
                title="Delivery"
                sub={`+₹${baseDeliveryFee.toFixed(0)} delivery`}
              />
              <OrderTypeCard
                active={orderType === 'TAKEAWAY'}
                onClick={() => setOrderType('TAKEAWAY')}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                }
                title="Takeaway"
                sub="No delivery fee"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div style={cardStyle}>
            <SectionLabel>Payment Method</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orderType === 'TAKEAWAY' && (
                <PaymentOption
                  active={paymentMethod === 'CASH'}
                  onClick={() => setPaymentMethod('CASH')}
                  icon={
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                  }
                  title="Cash on Pickup"
                  desc="Pay with cash when you collect your order"
                />
              )}
              <PaymentOption
                active={paymentMethod === 'CARD'}
                onClick={() => setPaymentMethod('CARD')}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                }
                title="Credit / Debit Card"
                desc="Pay securely via Razorpay"
              />
              <PaymentOption
                active={paymentMethod === 'UPI'}
                onClick={() => setPaymentMethod('UPI')}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                }
                title="UPI Payment"
                desc="Google Pay, PhonePe, Paytm & more"
              />
            </div>

            {(paymentMethod === 'CARD' || paymentMethod === 'UPI') && (
              <div style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '10px',
                fontSize: '0.8rem',
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                You will be redirected to Razorpay's secure payment gateway to complete your payment.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Order Summary */}
        <div style={{ position: 'sticky', top: '84px' }}>
          <div style={{ ...cardStyle, padding: '24px' }}>
            <SectionLabel>Order Summary</SectionLabel>

            {/* Items list */}
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600, marginRight: '6px' }}>{item.quantity}×</span>
                    {item.name}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <SummaryRow label={`Subtotal (${cartItems.length} items)`} value={`₹${subtotal.toFixed(2)}`} />
              {orderType === 'DELIVERY' && (
                <SummaryRow label="Delivery fee" value={`₹${deliveryFee.toFixed(2)}`} />
              )}
              <SummaryRow label="Tax (5%)" value={`₹${tax.toFixed(2)}`} />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--gold)' }}>₹{total.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '20px', lineHeight: 1.4 }}>
              Delivery charges may vary based on distance.
            </p>

            {/* Warning: no addresses */}
            {orderType === 'DELIVERY' && !guestInfo && customerProfile && customerProfile.addresses.length === 0 && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.35)',
                borderRadius: '10px',
                fontSize: '0.8rem',
                color: '#fbbf24',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Please add a delivery address in your profile to continue.
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlaceOrderDisabled}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: isPlaceOrderDisabled ? 'var(--border)' : 'linear-gradient(135deg, #c0392b, #e74c3c)',
                color: isPlaceOrderDisabled ? 'var(--text-3)' : '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isPlaceOrderDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
                marginBottom: '10px',
              }}
            >
              {isLoading
                ? 'Processing...'
                : paymentMethod === 'CASH'
                  ? `Place Order — ₹${total.toFixed(2)}`
                  : `Pay ₹${total.toFixed(2)} via Razorpay`}
            </button>

            <button
              onClick={() => navigate('/checkout')}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-2)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Back to Checkout
            </button>

            {paymentMethod !== 'CASH' && (
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secured by Razorpay · 256-bit SSL Encrypted
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Small helper components ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '22px 24px',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '14px' }}>
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--text-3)', minWidth: '80px' }}>{label}:</span>
      <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-1)' }}>{value}</span>
    </div>
  );
}

function OrderTypeCard({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '18px 14px',
        borderRadius: '12px',
        border: active ? '1.5px solid var(--gold)' : '1px solid var(--border)',
        background: active ? 'rgba(212,175,55,0.07)' : 'var(--surface-2)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ color: active ? 'var(--gold)' : 'var(--text-2)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? 'var(--text-1)' : 'var(--text-2)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}

function PaymentOption({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderRadius: '10px',
        border: active ? '1.5px solid var(--gold)' : '1px solid var(--border)',
        background: active ? 'rgba(212,175,55,0.07)' : 'var(--surface-2)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        border: active ? '5px solid var(--gold)' : '2px solid var(--text-3)',
      }} />
      <div style={{ color: active ? 'var(--gold)' : 'var(--text-2)', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: active ? 'var(--text-1)' : 'var(--text-2)' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{desc}</div>
      </div>
    </div>
  );
}

export default PaymentPage;
