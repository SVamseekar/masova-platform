import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCustomerByUserIdQuery,
  useUpdateCustomerMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  useUpdatePreferencesMutation,
  UpdateCustomerRequest,
  AddAddressRequest,
  UpdatePreferencesRequest,
} from '../../store/api/customerApi';
import { Button, Checkbox } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingPreferences, setEditingPreferences] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState<UpdateCustomerRequest>({});
  const [addressForm, setAddressForm] = useState<AddAddressRequest>({
    label: 'HOME',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [preferencesForm, setPreferencesForm] = useState<UpdatePreferencesRequest>({});

  // API queries
  const { data: customer, isLoading } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  const [updateCustomer] = useUpdateCustomerMutation();
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();
  const [updatePreferences] = useUpdatePreferencesMutation();

  useEffect(() => {
    if (customer && !editing) {
      setProfileForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
      });
    }
  }, [customer, editing]);

  useEffect(() => {
    if (customer && !editingPreferences) {
      setPreferencesForm({
        spiceLevel: customer.preferences?.spiceLevel || 'MEDIUM',
        cuisinePreferences: customer.preferences?.cuisinePreferences || [],
        dietaryRestrictions: customer.preferences?.dietaryRestrictions || [],
        allergens: customer.preferences?.allergens || [],
        preferredPaymentMethod: customer.preferences?.preferredPaymentMethod || '',
        notifyOnOffers: customer.preferences?.notifyOnOffers !== false,
        notifyOnOrderStatus: customer.preferences?.notifyOnOrderStatus !== false,
      });
    }
  }, [customer, editingPreferences]);

  const handleUpdateProfile = async () => {
    if (!customer) return;
    try {
      await updateCustomer({ id: customer.id, data: profileForm }).unwrap();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAddOrUpdateAddress = async () => {
    if (!customer) return;
    try {
      if (editingAddressId) {
        await updateAddress({ customerId: customer.id, addressId: editingAddressId, data: addressForm }).unwrap();
      } else {
        await addAddress({ customerId: customer.id, data: addressForm }).unwrap();
      }
      setAddressForm({
        label: 'HOME',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      });
      setAddressDialogOpen(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleEditAddress = (address: any) => {
    setAddressForm({
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      landmark: address.landmark,
    });
    setEditingAddressId(address.id);
    setAddressDialogOpen(true);
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (!customer || !window.confirm('Are you sure you want to remove this address?')) return;
    try {
      await removeAddress({ customerId: customer.id, addressId }).unwrap();
    } catch (error) {
      console.error('Error removing address:', error);
      alert('Failed to remove address. Please try again.');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!customer) return;
    try {
      await setDefaultAddress({ customerId: customer.id, addressId }).unwrap();
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address. Please try again.');
    }
  };

  const handleUpdatePreferences = async () => {
    if (!customer) return;
    try {
      await updatePreferences({ customerId: customer.id, data: preferencesForm }).unwrap();
      setEditingPreferences(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences. Please try again.');
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return '#E5E4E2';
      case 'GOLD': return '#FFD700';
      case 'SILVER': return '#C0C0C0';
      default: return '#CD7F32';
    }
  };

  const getNextTierInfo = (currentTier: string, currentPoints: number) => {
    const tiers = {
      BRONZE: { next: 'SILVER', threshold: 1000 },
      SILVER: { next: 'GOLD', threshold: 5000 },
      GOLD: { next: 'PLATINUM', threshold: 10000 },
      PLATINUM: { next: null, threshold: null },
    };
    const tierInfo = tiers[currentTier as keyof typeof tiers];
    if (!tierInfo.next) return null;

    const pointsNeeded = (tierInfo.threshold || 0) - currentPoints;
    const progress = (currentPoints / (tierInfo.threshold || 1)) * 100;

    return { nextTier: tierInfo.next, pointsNeeded, progress: Math.min(progress, 100) };
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[2],
    marginBottom: spacing[6],
    ...createNeumorphicSurface('inset', 'md', 'xl'),
    padding: spacing[2],
    backgroundColor: colors.surface.secondary,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.text.primary : colors.text.secondary,
    backgroundColor: isActive ? colors.surface.primary : 'transparent',
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ...(isActive ? createNeumorphicSurface('raised', 'md', 'lg') : {}),
  });

  const formGroupStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  };

  const inputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'base'),
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
  };

  const modalOverlayStyles: React.CSSProperties = {
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
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    ...createBadge(),
    backgroundColor: color,
    color: '#000',
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    display: 'inline-block',
  });

  const checkboxContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[2],
  };

  const infoCardStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.xl,
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  };

  const handleCartClick = () => {
    navigate('/menu');
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading...</div>
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader
            showPublicNav={true}
            onCartClick={handleCartClick}
          />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <p>Customer profile not found. Please contact support.</p>
          </div>
        </div>
      </>
    );
  }

  const nextTierInfo = customer.loyaltyInfo
    ? getNextTierInfo(customer.loyaltyInfo.tier, customer.loyaltyInfo.totalPoints)
    : null;

  const cuisineOptions = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'Continental', 'Mediterranean'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Keto', 'Halal', 'Kosher'];
  const allergenOptions = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'];

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <h1 style={titleStyles}>My Profile</h1>

        {/* Loyalty Card - Clean Professional Design */}
        {customer.loyaltyInfo && customer.orderStats && (
          <div style={{
            ...createNeumorphicSurface('raised', 'lg', 'xl'),
            padding: spacing[6],
            marginBottom: spacing[6],
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryDark} 100%)`,
            color: '#fff',
          }}>
            {/* Header Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div>
                <div style={{ fontSize: typography.fontSize.sm, opacity: 0.8, marginBottom: spacing[1] }}>
                  Loyalty Points
                </div>
                <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold }}>
                  {customer.loyaltyInfo?.totalPoints || 0}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: borderRadius.full,
                  backgroundColor: getLoyaltyTierColor(customer.loyaltyInfo?.tier || 'BRONZE'),
                  color: '#000',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {customer.loyaltyInfo?.tier || 'BRONZE'}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, marginTop: spacing[2], opacity: 0.8 }}>
                  Member since {new Date(customer.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div style={{ marginBottom: spacing[6] }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                marginBottom: spacing[3],
                opacity: 0.9,
                fontWeight: typography.fontWeight.medium,
              }}>
                {nextTierInfo
                  ? `${nextTierInfo.pointsNeeded} points until ${nextTierInfo.nextTier} tier`
                  : 'Maximum tier achieved!'}
              </div>

              {/* Simple clean progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: borderRadius.full,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${Math.min((customer.loyaltyInfo.totalPoints / 10000) * 100, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
                  transition: 'width 0.5s ease',
                  borderRadius: borderRadius.full,
                }}></div>
              </div>

              {/* Milestone labels below bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: spacing[2],
              }}>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.7 }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>Bronze</div>
                  <div>0</div>
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.7, textAlign: 'center' }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>Silver</div>
                  <div>1,000</div>
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.7, textAlign: 'center' }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>Gold</div>
                  <div>5,000</div>
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.7, textAlign: 'right' }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold }}>Platinum</div>
                  <div>10,000</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[3] }}>
              <div style={{
                padding: spacing[4],
                borderRadius: borderRadius.lg,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  {customer.orderStats?.totalOrders || 0}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.8, marginTop: spacing[1] }}>Total Orders</div>
              </div>
              <div style={{
                padding: spacing[4],
                borderRadius: borderRadius.lg,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  ₹{Math.round(customer.orderStats?.totalSpent || 0)}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.8, marginTop: spacing[1] }}>Total Spent</div>
              </div>
              <div style={{
                padding: spacing[4],
                borderRadius: borderRadius.lg,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  ₹{Math.round(customer.orderStats?.averageOrderValue || 0)}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, opacity: 0.8, marginTop: spacing[1] }}>Avg Order</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={tabsContainerStyles}>
          {['Personal Info', 'Addresses', 'Preferences'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(index);
                setEditing(false);
                setEditingPreferences(false);
              }}
              style={tabButtonStyles(activeTab === index)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ ...createNeumorphicSurface('raised', 'md', 'xl'), padding: spacing[6], backgroundColor: colors.surface.primary }}>
          {activeTab === 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Personal Information</h2>
                {!editing ? (
                  <Button variant="primary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                ) : (
                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleUpdateProfile}>Save</Button>
                  </div>
                )}
              </div>

              {editing ? (
                // Edit mode - show inputs
                <div>
                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Name</label>
                    <input
                      type="text"
                      value={profileForm.name || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      style={inputStyles}
                    />
                  </div>

                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Email</label>
                    <input
                      type="email"
                      value={profileForm.email || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      style={inputStyles}
                    />
                  </div>

                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={inputStyles}
                    />
                  </div>

                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      style={inputStyles}
                    />
                  </div>

                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Gender</label>
                    <select
                      value={profileForm.gender || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      style={inputStyles}
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              ) : (
                // View mode - show neumorphic cards
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[4] }}>
                  <div style={infoCardStyles}>
                    <div style={infoLabelStyles}>Name</div>
                    <div style={infoValueStyles}>{customer.name}</div>
                  </div>

                  <div style={infoCardStyles}>
                    <div style={infoLabelStyles}>Email</div>
                    <div style={infoValueStyles}>
                      {customer.email}
                      {customer.emailVerified && (
                        <span style={{ color: colors.semantic.success, fontSize: typography.fontSize.sm, marginLeft: spacing[2] }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={infoCardStyles}>
                    <div style={infoLabelStyles}>Phone</div>
                    <div style={infoValueStyles}>
                      {customer.phone}
                      {customer.phoneVerified && (
                        <span style={{ color: colors.semantic.success, fontSize: typography.fontSize.sm, marginLeft: spacing[2] }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={infoCardStyles}>
                    <div style={infoLabelStyles}>Date of Birth</div>
                    <div style={infoValueStyles}>{customer.dateOfBirth || 'Not set'}</div>
                  </div>

                  <div style={{ ...infoCardStyles, gridColumn: 'span 2' }}>
                    <div style={infoLabelStyles}>Gender</div>
                    <div style={infoValueStyles}>{customer.gender || 'Not set'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>My Addresses</h2>
                <Button variant="primary" size="sm" onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm({
                    label: 'HOME',
                    addressLine1: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'India',
                  });
                  setAddressDialogOpen(true);
                }}>Add Address</Button>
              </div>

              {customer.addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
                  No addresses saved. Add your first address to make ordering easier!
                </div>
              ) : (
                <div style={{ display: 'grid', gap: spacing[4] }}>
                  {customer.addresses.map((address) => (
                    <div key={address.id} style={{ ...createNeumorphicSurface('inset', 'sm', 'lg'), padding: spacing[4], backgroundColor: colors.surface.secondary }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                        <div>
                          <span style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.lg }}>
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span style={{ ...badgeStyles(colors.brand.primary), marginLeft: spacing[2] }}>Default</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2] }}>
                          <Button variant="secondary" size="sm" onClick={() => handleEditAddress(address)}>
                            Edit
                          </Button>
                          {!address.isDefault && (
                            <Button variant="secondary" size="sm" onClick={() => handleSetDefaultAddress(address.id)}>
                              Set Default
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => handleRemoveAddress(address.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 1.6 }}>
                        {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                        {address.city}, {address.state} - {address.postalCode}
                        {address.landmark && <><br />Landmark: {address.landmark}</>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                  My Preferences
                </h2>
                {!editingPreferences ? (
                  <Button variant="primary" size="sm" onClick={() => setEditingPreferences(true)}>Edit</Button>
                ) : (
                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button variant="secondary" size="sm" onClick={() => setEditingPreferences(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleUpdatePreferences}>Save</Button>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Spice Level</label>
                {editingPreferences ? (
                  <select
                    value={preferencesForm.spiceLevel || 'MEDIUM'}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, spiceLevel: e.target.value })}
                    style={inputStyles}
                  >
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HOT">Hot</option>
                    <option value="EXTRA_HOT">Extra Hot</option>
                  </select>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={infoValueStyles}>{customer.preferences?.spiceLevel || 'MEDIUM'}</div>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Cuisine Preferences</label>
                {editingPreferences ? (
                  <div style={checkboxContainerStyles}>
                    {cuisineOptions.map((cuisine) => (
                      <Checkbox
                        key={cuisine}
                        label={cuisine}
                        checked={(preferencesForm.cuisinePreferences || []).includes(cuisine)}
                        onChange={() => setPreferencesForm({
                          ...preferencesForm,
                          cuisinePreferences: toggleArrayItem(preferencesForm.cuisinePreferences || [], cuisine)
                        })}
                      />
                    ))}
                  </div>
                ) : customer.preferences?.cuisinePreferences?.length ? (
                  <div style={infoCardStyles}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                      {customer.preferences.cuisinePreferences.map((cuisine, idx) => (
                        <span key={idx} style={{
                          ...createNeumorphicSurface('raised', 'sm', 'md'),
                          padding: `${spacing[2]} ${spacing[3]}`,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          backgroundColor: colors.surface.primary,
                          borderRadius: borderRadius.full,
                        }}>
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={{ fontSize: typography.fontSize.base, color: colors.text.tertiary }}>No preferences set</div>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Dietary Restrictions</label>
                {editingPreferences ? (
                  <div style={checkboxContainerStyles}>
                    {dietaryOptions.map((restriction) => (
                      <Checkbox
                        key={restriction}
                        label={restriction}
                        checked={(preferencesForm.dietaryRestrictions || []).includes(restriction)}
                        onChange={() => setPreferencesForm({
                          ...preferencesForm,
                          dietaryRestrictions: toggleArrayItem(preferencesForm.dietaryRestrictions || [], restriction)
                        })}
                      />
                    ))}
                  </div>
                ) : customer.preferences?.dietaryRestrictions?.length ? (
                  <div style={infoCardStyles}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                      {customer.preferences.dietaryRestrictions.map((restriction, idx) => (
                        <span key={idx} style={{
                          ...createNeumorphicSurface('raised', 'sm', 'md'),
                          padding: `${spacing[2]} ${spacing[3]}`,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          backgroundColor: colors.surface.primary,
                          borderRadius: borderRadius.full,
                        }}>
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={{ fontSize: typography.fontSize.base, color: colors.text.tertiary }}>No restrictions set</div>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Allergens</label>
                {editingPreferences ? (
                  <div style={checkboxContainerStyles}>
                    {allergenOptions.map((allergen) => (
                      <Checkbox
                        key={allergen}
                        label={allergen}
                        checked={(preferencesForm.allergens || []).includes(allergen)}
                        onChange={() => setPreferencesForm({
                          ...preferencesForm,
                          allergens: toggleArrayItem(preferencesForm.allergens || [], allergen)
                        })}
                      />
                    ))}
                  </div>
                ) : customer.preferences?.allergens?.length ? (
                  <div style={infoCardStyles}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                      {customer.preferences.allergens.map((allergen, idx) => (
                        <span key={idx} style={{
                          ...createNeumorphicSurface('raised', 'sm', 'md'),
                          padding: `${spacing[2]} ${spacing[3]}`,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: '#FFFFFF',
                          backgroundColor: colors.semantic.error,
                          borderRadius: borderRadius.full,
                          boxShadow: `0 2px 8px ${colors.semantic.error}40`,
                        }}>
                          ⚠ {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={{ fontSize: typography.fontSize.base, color: colors.text.tertiary }}>No allergens set</div>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Preferred Payment Method</label>
                {editingPreferences ? (
                  <select
                    value={preferencesForm.preferredPaymentMethod || ''}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, preferredPaymentMethod: e.target.value })}
                    style={inputStyles}
                  >
                    <option value="">Select</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="WALLET">Wallet</option>
                  </select>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={infoValueStyles}>{customer.preferences?.preferredPaymentMethod || 'Not set'}</div>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Notifications</label>
                {editingPreferences ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    <Checkbox
                      label="Notify me about special offers and promotions"
                      checked={preferencesForm.notifyOnOffers !== false}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, notifyOnOffers: e.target.checked })}
                    />
                    <Checkbox
                      label="Notify me about order status updates"
                      checked={preferencesForm.notifyOnOrderStatus !== false}
                      onChange={(e) => setPreferencesForm({ ...preferencesForm, notifyOnOrderStatus: e.target.checked })}
                    />
                  </div>
                ) : (
                  <div style={infoCardStyles}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        <span style={{
                          display: 'inline-flex',
                          width: '20px',
                          height: '20px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: customer.preferences?.notifyOnOffers !== false ? colors.semantic.success : colors.surface.tertiary,
                          color: '#fff',
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.bold,
                        }}>
                          {customer.preferences?.notifyOnOffers !== false ? '✓' : '✗'}
                        </span>
                        <span style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>Special Offers</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        <span style={{
                          display: 'inline-flex',
                          width: '20px',
                          height: '20px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: customer.preferences?.notifyOnOrderStatus !== false ? colors.semantic.success : colors.surface.tertiary,
                          color: '#fff',
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.bold,
                        }}>
                          {customer.preferences?.notifyOnOrderStatus !== false ? '✓' : '✗'}
                        </span>
                        <span style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>Order Updates</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      {addressDialogOpen && (
        <div style={modalOverlayStyles} onClick={() => {
          setAddressDialogOpen(false);
          setEditingAddressId(null);
        }}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Label</label>
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                style={inputStyles}
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Address Line 1 *</label>
              <input
                type="text"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                style={inputStyles}
                placeholder="House/Flat number, Building name"
              />
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Address Line 2</label>
              <input
                type="text"
                value={addressForm.addressLine2 || ''}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                style={inputStyles}
                placeholder="Street, Area"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
              <div style={formGroupStyles}>
                <label style={labelStyles}>City *</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  style={inputStyles}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>State *</label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Postal Code *</label>
              <input
                type="text"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                style={inputStyles}
                placeholder="6 digit PIN code"
              />
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Landmark</label>
              <input
                type="text"
                value={addressForm.landmark || ''}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                style={inputStyles}
                placeholder="Nearby landmark for easy delivery"
              />
            </div>

            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => {
                setAddressDialogOpen(false);
                setEditingAddressId(null);
              }}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleAddOrUpdateAddress}
                disabled={!addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.postalCode}
              >
                {editingAddressId ? 'Update Address' : 'Add Address'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
