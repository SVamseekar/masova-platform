import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectDeliveryFee,
} from '../../store/slices/cartSlice';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface GuestFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  specialInstructions: string;
}

const GuestCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const deliveryFee = useAppSelector(selectDeliveryFee);

  const tax = subtotal * 0.05;
  const total = subtotal + (itemCount > 0 ? deliveryFee : 0) + tax;

  const [formData, setFormData] = useState<GuestFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '',
    specialInstructions: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<GuestFormData>>({});

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu');
    }
  }, [cartItems, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validateForm = (): boolean => {
    const errors: Partial<GuestFormData> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone must be 10 digits';
    }
    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^[0-9]{6}$/.test(formData.zipCode)) {
      errors.zipCode = 'ZIP code must be 6 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare guest info to pass to PaymentPage
      const guestInfo = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        street: `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}`,
        city: formData.city,
        state: formData.state,
        pincode: formData.zipCode,
        deliveryInstructions: formData.specialInstructions,
      };

      // Navigate to PaymentPage with guest info
      navigate('/payment', {
        state: { guestInfo }
      });
    } catch (err: any) {
      console.error('Guest checkout error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    padding: `${spacing[8]} ${spacing[4]}`,
    fontFamily: typography.fontFamily.primary,
  };

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6] }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'base'),
              padding: spacing[2],
              marginBottom: spacing[4],
              cursor: 'pointer',
              border: 'none',
              fontSize: typography.fontSize.lg,
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            margin: `${spacing[4]} 0 ${spacing[2]} 0`,
          }}>
            Guest Checkout
          </h1>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            margin: 0,
          }}>
            Complete your order without creating an account
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: spacing[8] }}>
          <Card elevation="lg" padding="xl">
            {error && (
              <div style={{
                ...createNeumorphicSurface('inset', 'base', 'base'),
                backgroundColor: colors.semantic.errorLight,
                border: `1px solid ${colors.semantic.error}`,
                color: colors.semantic.errorDark,
                padding: spacing[4],
                marginBottom: spacing[5],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                borderLeft: `4px solid ${colors.semantic.error}`,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
              {/* Contact Information */}
              <div>
                <h3 style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.text.primary,
                  margin: `0 0 ${spacing[4]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}>
                  <span>📞</span> Contact Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      state={validationErrors.firstName ? 'error' : 'default'}
                      helperText={validationErrors.firstName}
                      disabled={loading}
                      size="lg"
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      state={validationErrors.lastName ? 'error' : 'default'}
                      helperText={validationErrors.lastName}
                      disabled={loading}
                      size="lg"
                      required
                    />
                  </div>
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    state={validationErrors.email ? 'error' : 'default'}
                    helperText={validationErrors.email || 'For order confirmation'}
                    disabled={loading}
                    size="lg"
                    leftIcon="📧"
                    required
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    state={validationErrors.phone ? 'error' : 'default'}
                    helperText={validationErrors.phone || 'For delivery updates'}
                    placeholder="10-digit mobile number"
                    disabled={loading}
                    size="lg"
                    leftIcon="📱"
                    required
                  />
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary }} />

              {/* Delivery Address */}
              <div>
                <h3 style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.text.primary,
                  margin: `0 0 ${spacing[4]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}>
                  <span>📍</span> Delivery Address
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                  <Input
                    label="Address Line 1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    state={validationErrors.addressLine1 ? 'error' : 'default'}
                    helperText={validationErrors.addressLine1 || 'House/Flat number, Building name'}
                    disabled={loading}
                    size="lg"
                    required
                  />
                  <Input
                    label="Address Line 2"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    helperText="Street, Area, Landmark (optional)"
                    disabled={loading}
                    size="lg"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      state={validationErrors.city ? 'error' : 'default'}
                      helperText={validationErrors.city}
                      disabled={loading}
                      size="lg"
                      required
                    />
                    <Input
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      state={validationErrors.state ? 'error' : 'default'}
                      helperText={validationErrors.state}
                      disabled={loading}
                      size="lg"
                      required
                    />
                  </div>
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    state={validationErrors.zipCode ? 'error' : 'default'}
                    helperText={validationErrors.zipCode}
                    placeholder="6-digit PIN code"
                    disabled={loading}
                    size="lg"
                    required
                  />
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.secondary,
                      marginBottom: spacing[2],
                      textTransform: 'uppercase',
                      letterSpacing: typography.letterSpacing.wide,
                    }}>
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleChange}
                      placeholder="Any special delivery instructions..."
                      disabled={loading}
                      rows={3}
                      style={{
                        ...createNeumorphicSurface('inset', 'base', 'md'),
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: typography.fontSize.base,
                        fontWeight: 500,
                        color: colors.text.primary,
                        padding: `${spacing[3]} ${spacing[4]}`,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                isLoading={loading}
                disabled={loading}
              >
                Proceed to Payment
              </Button>
            </form>
          </Card>

          {/* Order Summary */}
          <div>
            <Card elevation="lg" padding="lg" style={{ position: 'sticky', top: spacing[4] }}>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.extrabold,
                color: colors.text.primary,
                margin: `0 0 ${spacing[4]} 0`,
              }}>
                Order Summary
              </h3>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[4]} 0` }} />

              <div style={{ marginBottom: spacing[4], maxHeight: '300px', overflowY: 'auto' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing[3],
                    paddingBottom: spacing[3],
                    borderBottom: `1px solid ${colors.surface.secondary}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginBottom: spacing[1],
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.tertiary,
                      }}>
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[4]} 0` }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[4] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.semantic.success }}>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  <span>Tax (5%)</span>
                  <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', backgroundColor: colors.surface.tertiary, margin: `${spacing[2]} 0` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.extrabold, color: colors.text.primary }}>
                    Total Amount
                  </span>
                  <span style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.extrabold, color: colors.brand.primary }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckoutPage;
