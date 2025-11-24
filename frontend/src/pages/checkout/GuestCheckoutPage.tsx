import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartItemCount,
  selectDeliveryFee,
} from '../../store/slices/cartSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCustomerByUserIdQuery,
  useAddAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  CustomerAddress,
} from '../../store/api/customerApi';
import { Button, Card, Input } from '../../components/ui/neumorphic';
import { colors, spacing, typography } from '../../styles/design-tokens';
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
  addressLabel: string;
}

const GuestCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const deliveryFee = useAppSelector(selectDeliveryFee);
  const currentUser = useAppSelector(selectCurrentUser);

  const isLoggedIn = !!currentUser;
  const tax = subtotal * 0.05;
  const total = subtotal + (itemCount > 0 ? deliveryFee : 0) + tax;

  // Fetch customer data for logged-in users
  const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomerByUserIdQuery(
    currentUser?.id || '',
    { skip: !isLoggedIn }
  );

  const [addAddress] = useAddAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  // Address selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  // Parse name into first and last name
  const nameParts = currentUser?.name?.split(' ') || [];
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState<GuestFormData>({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '',
    specialInstructions: '',
    addressLabel: 'HOME',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<GuestFormData>>({});
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  // Set default address if customer has one - filter to only include addresses with IDs and addressLine1
  useEffect(() => {
    if (customerData?.addresses && customerData.addresses.length > 0) {
      // Filter addresses that have both ID and addressLine1 (complete addresses)
      const validAddresses = customerData.addresses.filter(a => a.id && a.addressLine1);
      if (validAddresses.length > 0) {
        const defaultAddr = validAddresses.find(a => a.isDefault) || validAddresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [customerData]);

  // Populate form fields when a saved address is selected
  useEffect(() => {
    if (selectedAddressId && selectedAddressId !== 'new' && customerData?.addresses) {
      const selectedAddress = customerData.addresses.find(a => a.id === selectedAddressId);
      if (selectedAddress) {
        setFormData(prev => ({
          ...prev,
          addressLine1: selectedAddress.addressLine1 || '',
          addressLine2: selectedAddress.addressLine2 || '',
          city: selectedAddress.city || '',
          state: selectedAddress.state || '',
          zipCode: selectedAddress.postalCode || '',
          addressLabel: selectedAddress.label || 'HOME',
        }));
      }
    } else if (selectedAddressId === 'new') {
      // Reset address fields when "new" is selected
      setFormData(prev => ({
        ...prev,
        addressLine1: '',
        addressLine2: '',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '',
        addressLabel: 'HOME',
      }));
    }
  }, [selectedAddressId, customerData?.addresses]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu');
    }
  }, [cartItems, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!customerData?.id) {
      console.error('No customer ID found');
      return;
    }

    console.log('Deleting address:', { customerId: customerData.id, addressId });
    setDeletingAddress(true);
    try {
      const result = await removeAddress({ customerId: customerData.id, addressId }).unwrap();
      console.log('Address deleted successfully:', result);
      // If the deleted address was selected, switch to 'new'
      if (selectedAddressId === addressId) {
        setSelectedAddressId('new');
      }
      setAddressToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      setError(err?.data?.message || 'Failed to delete address. Please try again.');
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customerData?.id) {
      console.error('No customer ID found');
      return;
    }

    console.log('Setting default address:', { customerId: customerData.id, addressId });
    try {
      const result = await setDefaultAddress({ customerId: customerData.id, addressId }).unwrap();
      console.log('Default address set successfully:', result);
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      setError(err?.data?.message || 'Failed to set default address. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<GuestFormData> = {};

    // Always validate phone for logged-in users
    if (isLoggedIn) {
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^[6-9][0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Enter valid 10-digit Indian mobile number';
      }
    }

    // If using saved address, skip other validation
    if (isLoggedIn && selectedAddressId !== 'new') {
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Enter valid 10-digit Indian mobile number';
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
      let guestInfo;

      // If using a saved address
      if (isLoggedIn && selectedAddressId !== 'new' && customerData?.addresses) {
        const savedAddress = customerData.addresses.find(a => a.id === selectedAddressId);
        if (savedAddress) {
          guestInfo = {
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            phone: formData.phone, // Use phone from form (editable)
            street: `${savedAddress.addressLine1}${savedAddress.addressLine2 ? ', ' + savedAddress.addressLine2 : ''}`,
            city: savedAddress.city,
            state: savedAddress.state,
            pincode: savedAddress.postalCode,
            deliveryInstructions: formData.specialInstructions,
          };
        }
      } else {
        // Using new address
        guestInfo = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          street: `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}`,
          city: formData.city,
          state: formData.state,
          pincode: formData.zipCode,
          deliveryInstructions: formData.specialInstructions,
        };

        // Save new address for logged-in users if checkbox is checked
        if (isLoggedIn && saveNewAddress && customerData?.id) {
          try {
            await addAddress({
              customerId: customerData.id,
              data: {
                label: formData.addressLabel,
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2 || undefined,
                city: formData.city,
                state: formData.state,
                postalCode: formData.zipCode,
                isDefault: !customerData.addresses || customerData.addresses.length === 0,
              },
            }).unwrap();
          } catch (err) {
            console.error('Failed to save address:', err);
            // Continue with checkout even if address save fails
          }
        }
      }

      // Navigate to PaymentPage with guest info
      navigate('/payment', {
        state: { guestInfo }
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter to only show complete addresses (with ID and addressLine1)
  const savedAddresses = (customerData?.addresses || []).filter(a => a.id && a.addressLine1);

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.surface.background,
    padding: `${spacing[8]} ${spacing[4]}`,
    fontFamily: typography.fontFamily.primary,
  };

  const addressCardStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'raised', 'base', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[3],
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: isSelected ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
  });

  const labelBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor: colors.brand.primary,
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    borderRadius: '4px',
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  };

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6] }}>
          <button
            onClick={() => navigate(isLoggedIn ? '/menu' : '/checkout')}
            style={{
              ...createNeumorphicSurface('raised', 'sm', 'base'),
              padding: spacing[2],
              marginBottom: spacing[4],
              cursor: 'pointer',
              border: 'none',
              fontSize: typography.fontSize.lg,
            }}
          >
            ← {isLoggedIn ? 'Back to Menu' : 'Back'}
          </button>
          <h1 style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            margin: `${spacing[4]} 0 ${spacing[2]} 0`,
          }}>
            {isLoggedIn ? 'Delivery Details' : 'Guest Checkout'}
          </h1>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            margin: 0,
          }}>
            {isLoggedIn
              ? (savedAddresses.length > 0
                  ? 'Select a saved address or add a new one'
                  : 'Enter your delivery address to complete your order')
              : 'Complete your order without creating an account'}
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

            {isLoadingCustomer && isLoggedIn && (
              <div style={{ textAlign: 'center', padding: spacing[8] }}>
                Loading your saved addresses...
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
              {/* Contact Phone - Always show for logged-in users */}
              {isLoggedIn && (
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
                    <span>📞</span> Contact Number
                  </h3>
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
              )}

              {/* Saved Addresses Section - Only for logged-in users */}
              {isLoggedIn && savedAddresses.length > 0 && (
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
                    <span>📍</span> Saved Addresses
                  </h3>

                  {savedAddresses.map((addr: CustomerAddress) => (
                    <div
                      key={addr.id}
                      style={addressCardStyles(selectedAddressId === addr.id)}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <span style={labelBadgeStyles}>
                            {addr.label} {addr.isDefault && '(Default)'}
                          </span>
                          <div style={{
                            fontSize: typography.fontSize.base,
                            color: colors.text.primary,
                            fontWeight: typography.fontWeight.medium,
                          }}>
                            {addr.addressLine1}
                            {addr.addressLine2 && `, ${addr.addressLine2}`}
                          </div>
                          <div style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.secondary,
                            marginTop: spacing[1],
                          }}>
                            {addr.city}, {addr.state} - {addr.postalCode}
                          </div>
                          {addr.landmark && (
                            <div style={{
                              fontSize: typography.fontSize.xs,
                              color: colors.text.tertiary,
                              marginTop: spacing[1],
                            }}>
                              Landmark: {addr.landmark}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{
                            display: 'flex',
                            gap: spacing[2],
                            marginTop: spacing[3],
                          }}>
                            {!addr.isDefault && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddressToDelete(addr.id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedAddressId === addr.id ? colors.brand.primary : colors.surface.tertiary}`,
                          backgroundColor: selectedAddressId === addr.id ? colors.brand.primary : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginLeft: spacing[3],
                        }}>
                          {selectedAddressId === addr.id && (
                            <span style={{ color: colors.text.inverse, fontSize: '14px' }}>✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Address Option */}
                  <div
                    style={addressCardStyles(selectedAddressId === 'new')}
                    onClick={() => setSelectedAddressId('new')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <span style={{ fontSize: '24px' }}>➕</span>
                      <div>
                        <div style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                        }}>
                          Use a New Address
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary,
                        }}>
                          Enter a different delivery address
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Address Form - Show if guest or if "new" is selected */}
              {(!isLoggedIn || selectedAddressId === 'new') && (
                <>
                  {/* Contact Information - Only for guests */}
                  {!isLoggedIn && (
                    <>
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
                    </>
                  )}

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
                      <span>📍</span> {isLoggedIn ? 'New Address' : 'Delivery Address'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                      {/* Address Label - Only for logged-in users */}
                      {isLoggedIn && (
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
                            Address Label
                          </label>
                          <select
                            name="addressLabel"
                            value={formData.addressLabel}
                            onChange={handleChange}
                            style={{
                              ...createNeumorphicSurface('inset', 'base', 'md'),
                              width: '100%',
                              padding: `${spacing[3]} ${spacing[4]}`,
                              fontSize: typography.fontSize.base,
                              fontWeight: typography.fontWeight.medium,
                              color: colors.text.primary,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="HOME">Home</option>
                            <option value="WORK">Work</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      )}

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

                      {/* Save Address Checkbox - Only for logged-in users */}
                      {isLoggedIn && (
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[3],
                          cursor: 'pointer',
                          padding: spacing[3],
                          backgroundColor: colors.surface.secondary,
                          borderRadius: '8px',
                        }}>
                          <input
                            type="checkbox"
                            checked={saveNewAddress}
                            onChange={(e) => setSaveNewAddress(e.target.checked)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                            }}
                          />
                          <span style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.primary,
                            fontWeight: typography.fontWeight.medium,
                          }}>
                            Save this address for future orders
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Special Instructions - Always show */}
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

              <Button
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                isLoading={loading}
                disabled={loading || isLoadingCustomer}
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

      {/* Delete Address Confirmation Modal */}
      {addressToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Card elevation="lg" padding="lg" style={{ maxWidth: '400px', width: '90%' }}>
            <h3 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              margin: `0 0 ${spacing[3]} 0`,
            }}>
              Delete Address
            </h3>
            <p style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              margin: `0 0 ${spacing[5]} 0`,
            }}>
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                size="base"
                onClick={() => setAddressToDelete(null)}
                disabled={deletingAddress}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="base"
                onClick={() => handleDeleteAddress(addressToDelete)}
                isLoading={deletingAddress}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GuestCheckoutPage;
