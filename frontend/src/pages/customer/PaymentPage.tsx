import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Banknote, CreditCard, Smartphone, Store, Truck, Utensils } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { useCreateOrderMutation, type Order } from '../../store/api/orderApi';
import { useInitiatePaymentMutation, type PaymentResponse } from '../../store/api/paymentApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useGeocoding } from '../../hooks/useGeocoding';
import { defaultAddressCountry } from '../../utils/customerFormValidation';
import { useGetCustomerByUserIdQuery, useGetOrCreateCustomerMutation, useUpdatePreferencesMutation } from '../../store/api/customerApi';
import { useCheckDeliveryRadiusQuery } from '../../store/api/storeApi';
import {
  selectCartItems,
  selectSelectedStoreId,
  selectCartCurrency,
  selectCartLocale,
  selectStoreCountryCode,
} from '../../store/slices/cartSlice';
import {formatMajorAmount} from '../../utils/currency';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { loadStripe, type StripeElementLocale } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  isUpiAvailable,
  resolvePreferredPaymentMethod,
  type PaymentMethodCode,
} from '../../utils/paymentMethods';
import { checkoutCartConfiguration, useCheckoutStore, type CheckoutHandoff } from '../checkout/components/checkoutContext';
import CheckoutSummary from '../checkout/components/CheckoutSummary';
import '../checkout/components/Checkout.css';

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
  latitude?: number;
  longitude?: number;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = useAppSelector(selectCartItems);
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const storeCountryCode = useAppSelector(selectStoreCountryCode);
  // Country only from cart after store profile hydration — never invent DE
  const paymentCountry = storeCountryCode;
  const showUpi = isUpiAvailable(paymentCountry);
  // Gateway shown to the customer follows the same store-country rule as the offered methods
  const gatewayName = showUpi ? 'Razorpay' : 'Stripe';
  const fmt = (v: number) => formatMajorAmount(v , currency, locale);
  const checkout = useCheckoutStore();

  // Get guest info from navigation state (passed from GuestCheckoutPage)
  const handoff = location.state as Partial<CheckoutHandoff> | null;
  const checkoutContextChanged = (handoff?.checkoutStoreId !== undefined && handoff.checkoutStoreId !== selectedStoreId)
    || (handoff?.checkoutUserId !== undefined && handoff.checkoutUserId !== (currentUser?.id || null))
    || (handoff?.cartConfiguration !== undefined && handoff.cartConfiguration !== checkoutCartConfiguration(cartItems));
  const guestInfo = checkoutContextChanged ? undefined : handoff?.guestInfo as GuestInfo | undefined;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('CARD');
  const [stripeData, setStripeData] = React.useState<{
    clientSecret: string;
    publishableKey: string;
    orderId: string;
  } | null>(null);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>(() => handoff?.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY');
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Order already created for this visit; reused on payment retry so a retry never creates a second order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const submitting = useRef(false);
  const { geocode } = useGeocoding();

  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
  const [getOrCreateCustomer] = useGetOrCreateCustomerMutation();
  const [updatePreferences] = useUpdatePreferencesMutation();

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
        !!guestInfo ||
        !selectedStoreId ||
        selectedLat === null ||
        selectedLng === null,
    }
  );

  const isOutsideDeliveryRadius =
    orderType === 'DELIVERY' &&
    !guestInfo &&
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
    // DELIVERY and DINE_IN do not show cash option in UI; clear stale CASH state if order type changes
    if ((orderType === 'DELIVERY' || orderType === 'DINE_IN') && paymentMethod === 'CASH') {
      setPaymentMethod('CARD');
    }
  }, [orderType, paymentMethod]);

  useEffect(() => {
    const preferred = customerProfile?.preferences?.preferredPaymentMethod;
    // A late profile load must not change the method of an order that already exists
    if (!preferred || createdOrder) return;
    const resolved = resolvePreferredPaymentMethod(preferred, paymentCountry, 'CARD');
    if (resolved === 'CASH' && orderType === 'DELIVERY') {
      setPaymentMethod('CARD');
    } else {
      setPaymentMethod(resolved);
    }
  }, [customerProfile?.preferences?.preferredPaymentMethod, orderType, paymentCountry, createdOrder]);

  const handlePlaceOrder = async () => {
    if (checkoutContextChanged || submitting.current) return;
    submitting.current = true;
    setError('');
    let orderForPayment = createdOrder;
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
        } catch (err: unknown) {
          const errorMessage = getApiErrorMessage(err, 'Unable to retrieve customer profile');
          setError(`Your customer profile could not be loaded. Try again or contact the store. ${errorMessage}`);
          return;
        }
      }

      if (currentUser && !customerId) {
        setError('Your customer profile could not be loaded. Refresh the page and try again.');
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
            latitude: guestInfo.latitude,
            longitude: guestInfo.longitude,
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
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude,
            };
          }
        }
      }

      // The store prices delivery by distance, so the address needs coordinates
      if (!orderForPayment && deliveryAddress && (deliveryAddress.latitude == null || deliveryAddress.longitude == null)) {
        const country = storeCountryCode ? defaultAddressCountry(storeCountryCode) : '';
        const located = await geocode([deliveryAddress.street, deliveryAddress.pincode, deliveryAddress.city, country].filter(Boolean).join(', ')).catch(() => null);
        if (!located) {
          setError('This delivery address could not be located, so delivery cannot be priced. Go back and check the address, or choose pickup.');
          return;
        }
        deliveryAddress = { ...deliveryAddress, latitude: located.latitude, longitude: located.longitude };
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
          variant: item.variant,
          customizations: item.customizations,
        })),
        orderType,
        paymentMethod,
        deliveryAddress,
        specialInstructions,
        ...(orderType === "DINE_IN" && tableNumber ? { tableNumber: parseInt(tableNumber, 10) } : {}),
        ...(orderType === "DINE_IN" && guestCount ? { guestCount: parseInt(guestCount, 10) } : {}),
      };

      const orderResult = orderForPayment ?? await createOrder(orderData).unwrap();
      orderForPayment = orderResult;
      setCreatedOrder(orderResult);
      const orderId = orderResult.id;

      if (paymentMethod === 'CASH') {
        if (customerProfile?.id) {
          updatePreferences({
            customerId: customerProfile.id,
            data: { preferredPaymentMethod: paymentMethod },
          }).catch(() => undefined);
        }
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
        countryCode: storeCountryCode ?? undefined,
        currency,
      }).unwrap();

      // If Stripe gateway — show Stripe PaymentElement in-page instead of opening Razorpay modal
      if (paymentResult.paymentGateway === 'STRIPE' && paymentResult.stripeClientSecret && paymentResult.stripePublishableKey) {
        setStripeData({
          clientSecret: paymentResult.stripeClientSecret,
          publishableKey: paymentResult.stripePublishableKey,
          orderId: paymentResult.orderId,
        });
        return;
      }
      if (paymentResult.paymentGateway === 'STRIPE') {
        setError('Your order was created but the card form could not be prepared. Try again; no second order will be created.');
        return;
      }

      await openRazorpayCheckout(paymentResult, orderId);

    } catch (err: unknown) {
      setError(orderForPayment
        ? `Your order was created but payment could not be started (${getApiErrorMessage(err, 'payment service error')}). Try again; no second order will be created.`
        : getApiErrorMessage(err, 'Your order could not be created. Try again.'));
    } finally {
      submitting.current = false;
    }
  };

  const openRazorpayCheckout = async (paymentData: PaymentResponse, orderId: string) => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
        // Resolve on failure too; the missing SDK is reported just below
        script.onerror = resolve;
      });
    }
    if (!window.Razorpay) {
      setError('Razorpay could not be loaded. Refresh the page and try again.');
      return;
    }
    if (!paymentData.razorpayKeyId || !paymentData.razorpayOrderId) {
      setError('Payment configuration is incomplete. Try again.');
      return;
    }

    const options: RazorpayOptions = {
      key: paymentData.razorpayKeyId,
      amount: paymentData.amount * 100,
      currency: 'INR',
      name: 'MaSoVa Restaurant',
      description: `Order #${orderId}`,
      order_id: paymentData.razorpayOrderId,
      handler: function (response: RazorpaySuccessResponse) {
        if (customerProfile?.id) {
          updatePreferences({
            customerId: customerProfile.id,
            data: { preferredPaymentMethod: paymentMethod },
          }).catch(() => undefined);
        }
        setOrderPlaced(true);
        navigate(`/payment/success?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}&order_id=${orderId}`);
      },
      prefill: {
        name: guestInfo?.name || currentUser?.name || '',
        email: guestInfo?.email || currentUser?.email || '',
        contact: guestInfo?.phone || currentUser?.phone || '',
      },
      notes: { order_id: orderId },
      theme: { color: '#C62A09' /* Razorpay needs a hex */ },
      modal: {
        ondismiss: function() {
          navigate(`/payment/failed?order_id=${orderId}&error=Payment cancelled by user`);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response: RazorpayFailedResponse) {
      navigate(`/payment/failed?order_id=${orderId}&error=${response.error.description || 'Payment failed'}`);
    });
    razorpay.open();
  };

  const carriedAddressMissing = orderType === 'DELIVERY' && !!guestInfo && !guestInfo.street.trim();
  const isPlaceOrderDisabled = checkoutContextChanged || carriedAddressMissing || isLoading || (orderType === 'DELIVERY' && !guestInfo && (!customerProfile || !selectedAddressId)) || isOutsideDeliveryRadius || (orderType === 'DINE_IN' && !tableNumber);
  // Order type and method are fixed once the store has created the order
  const locked = isLoading || !!createdOrder;
  const noSavedAddress = orderType === 'DELIVERY' && !guestInfo && !!customerProfile && customerProfile.addresses.length === 0;

  return (
    <BrowseShell>
      <main className="checkout-page">
        <Link to="/guest-checkout">Back to details</Link>
        <div className="checkout-heading">
          <h1>Payment</h1>
          <p>Review your details and choose how to pay.</p>
        </div>

        <div className="checkout-columns">
          <section className="checkout-form" aria-label="Payment details">
            {(checkoutContextChanged || carriedAddressMissing) && (
              <div className="checkout-error" role="alert">
                <p>{checkoutContextChanged ? 'Your store, cart or account changed. Review checkout details before placing an order.' : 'Enter a delivery address before switching this pickup order to delivery.'}</p>
                <button type="button" onClick={() => navigate('/guest-checkout')}>Review checkout details</button>
              </div>
            )}
            {error && <div className="checkout-error" role="alert">{error}</div>}

            {guestInfo && (
              <section className="checkout-review" aria-labelledby="payment-details-title">
                <div className="checkout-summary-title">
                  <h2 id="payment-details-title">{orderType === 'DELIVERY' ? 'Delivery details' : 'Contact details'}</h2>
                  {!createdOrder && <Link to="/guest-checkout">Edit details</Link>}
                </div>
                <dl>
                  <InfoRow label="Name" value={guestInfo.name} />
                  <InfoRow label="Email" value={guestInfo.email} />
                  <InfoRow label="Phone" value={guestInfo.phone} />
                  {orderType === 'DELIVERY' && <InfoRow label="Address" value={[guestInfo.street, guestInfo.pincode, guestInfo.city, guestInfo.state].filter(Boolean).join(', ')} />}
                  {guestInfo.deliveryInstructions && <InfoRow label="Instructions" value={guestInfo.deliveryInstructions} />}
                </dl>
              </section>
            )}

            {!checkoutContextChanged && currentUser && !guestInfo && customerProfile && (
              <>
                <section className="checkout-review" aria-labelledby="payment-customer-title">
                  <h2 id="payment-customer-title">Your details</h2>
                  <dl>
                    <InfoRow label="Name" value={currentUser.name} />
                    <InfoRow label="Email" value={currentUser.email || ''} />
                    <InfoRow label="Phone" value={currentUser.phone || ''} />
                  </dl>
                </section>
                {orderType === 'DELIVERY' && (
                  <fieldset disabled={locked}>
                    <legend>Delivery address</legend>
                    {customerProfile.addresses.map(address => (
                      <label className="checkout-choice" key={address.id}>
                        <span>
                          <strong>{address.label}{address.isDefault ? ' · Default' : ''}</strong>
                          <small>{[address.addressLine1, address.addressLine2, address.postalCode, address.city, address.state].filter(Boolean).join(', ')}{address.landmark ? ` · Landmark: ${address.landmark}` : ''}</small>
                        </span>
                        <input type="radio" name="paymentAddress" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} />
                      </label>
                    ))}
                    {noSavedAddress && <p className="checkout-note" role="status">You have no saved addresses. <Link to="/guest-checkout">Add a delivery address</Link> to continue.</p>}
                    {isOutsideDeliveryRadius && (
                      <div className="checkout-error" role="alert">
                        Your delivery address is outside this store's delivery area ({radiusCheck?.deliveryRadiusKm} km radius). Choose a closer address or switch to pickup.
                      </div>
                    )}
                  </fieldset>
                )}
              </>
            )}

            <fieldset disabled={locked}>
              <legend>Order type</legend>
              <div className="checkout-radio-row checkout-radio-row-3">
                <ChoiceRadio name="paymentOrderType" checked={orderType === 'DELIVERY'} onChange={() => setOrderType('DELIVERY')} icon={<Truck size={24} aria-hidden="true" />} title="Delivery" description="Fee confirmed with order" />
                <ChoiceRadio name="paymentOrderType" checked={orderType === 'TAKEAWAY'} onChange={() => setOrderType('TAKEAWAY')} icon={<Store size={24} aria-hidden="true" />} title="Pickup" description="Collect at the selected store" />
                <ChoiceRadio name="paymentOrderType" checked={orderType === 'DINE_IN'} onChange={() => setOrderType('DINE_IN')} icon={<Utensils size={24} aria-hidden="true" />} title="Dine in" description="Eat at the restaurant" />
              </div>
            </fieldset>

            {orderType === 'DINE_IN' && (
              <fieldset disabled={locked}>
                <legend>Table details</legend>
                <div className="checkout-fields">
                  <div className="checkout-field">
                    <label htmlFor="payment-tableNumber">Table number</label>
                    <input id="payment-tableNumber" type="number" inputMode="numeric" min={1} value={tableNumber} onChange={e => setTableNumber(e.target.value)} required />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="payment-guestCount">Number of guests (optional)</label>
                    <input id="payment-guestCount" type="number" inputMode="numeric" min={1} value={guestCount} onChange={e => setGuestCount(e.target.value)} />
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset disabled={locked}>
              <legend>Payment method</legend>
              {orderType === 'TAKEAWAY' && (
                <ChoiceRadio name="paymentMethod" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} icon={<Banknote size={24} aria-hidden="true" />} title="Cash on Pickup" description="Pay with cash when you collect your order" />
              )}
              <ChoiceRadio name="paymentMethod" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} icon={<CreditCard size={24} aria-hidden="true" />} title="Credit / Debit Card" description={`Processed by ${gatewayName}`} />
              {showUpi && (
                <ChoiceRadio name="paymentMethod" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} icon={<Smartphone size={24} aria-hidden="true" />} title="UPI Payment" description="Google Pay, PhonePe, Paytm & more" />
              )}
            </fieldset>

            {stripeData && createdOrder ? (
              <section aria-labelledby="payment-card-title">
                <h2 id="payment-card-title" className="checkout-section-title">Card details</h2>
                <p className="checkout-note" role="status">Your order is created and awaiting payment. Card details are entered with Stripe.</p>
                <StripePaymentForm
                  clientSecret={stripeData.clientSecret}
                  publishableKey={stripeData.publishableKey}
                  orderId={stripeData.orderId}
                  locale={locale}
                  payLabel={Number.isFinite(createdOrder.total) ? `Pay ${fmt(createdOrder.total)}` : 'Pay now'}
                  onSuccess={() => {
                    setOrderPlaced(true);
                    navigate(`/payment/success?order_id=${stripeData.orderId}`);
                  }}
                  onError={setError}
                />
              </section>
            ) : (
              <>
                <button type="button" className="browse-primary browse-full" onClick={handlePlaceOrder} disabled={isPlaceOrderDisabled}>
                  {isLoading ? 'Processing…' : paymentMethod === 'CASH' ? 'Place order' : createdOrder ? 'Retry payment' : 'Place order and pay'}
                </button>
                {paymentMethod !== 'CASH' && (
                  <p className="checkout-secure-note">The store confirms your total first. Payment is then completed with {gatewayName}.</p>
                )}
              </>
            )}
          </section>

          <CheckoutSummary checkout={checkout} orderType={orderType} order={createdOrder ?? undefined} placesOrder />
        </div>
      </main>
    </BrowseShell>
  );
};

// ─── Small helper components ─────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ChoiceRadio({ name, checked, onChange, icon, title, description }: { name: string; checked: boolean; onChange: () => void; icon: React.ReactNode; title: string; description: string }) {
  return (
    <label className="checkout-choice">
      {icon}
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
    </label>
  );
}

// ─── Stripe Payment Components ────────────────────────────────────────────────

interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  orderId: string;
  locale: string;
  payLabel: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function StripePaymentForm({ clientSecret, publishableKey, orderId, onSuccess, onError, locale, payLabel }: StripePaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const stripeLocale = locale.split('-')[0];
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: stripeLocale as StripeElementLocale }}>
      <StripeCheckoutInner orderId={orderId} onSuccess={onSuccess} onError={onError} payLabel={payLabel} />
    </Elements>
  );
}

function StripeCheckoutInner({ orderId, onSuccess, onError, payLabel }: Pick<StripePaymentFormProps, 'orderId' | 'onSuccess' | 'onError' | 'payLabel'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
        },
      });
      if (error) {
        onError(error.message ?? 'Payment failed');
        setIsSubmitting(false);
      } else {
        onSuccess();
      }
    } catch {
      onError('Payment could not be submitted. Check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-stripe">
      <PaymentElement />
      <button type="button" className="browse-primary browse-full" onClick={handleConfirm} disabled={isSubmitting || !stripe}>
        {isSubmitting ? 'Processing…' : payLabel}
      </button>
    </div>
  );
}

export default PaymentPage;
