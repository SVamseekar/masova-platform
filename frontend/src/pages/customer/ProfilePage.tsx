import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetCustomerByUserIdQuery,
  useUpdateCustomerMutation,
  useAddAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  Customer,
  UpdateCustomerRequest,
  AddAddressRequest,
} from '../../store/api/customerApi';
import { Button } from '../../components/ui/neumorphic';
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

  // API queries
  const { data: customer, isLoading } = useGetCustomerByUserIdQuery(currentUser?.id || '', {
    skip: !currentUser?.id,
  });

  const [updateCustomer] = useUpdateCustomerMutation();
  const [addAddress] = useAddAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

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

  const handleUpdateProfile = async () => {
    if (!customer) return;
    try {
      await updateCustomer({ id: customer.id, data: profileForm }).unwrap();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!customer) return;
    try {
      await addAddress({ customerId: customer.id, data: addressForm }).unwrap();
      setAddressForm({
        label: 'HOME',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      });
      setAddressDialogOpen(false);
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (!customer || !window.confirm('Are you sure you want to remove this address?')) return;
    try {
      await removeAddress({ customerId: customer.id, addressId }).unwrap();
    } catch (error) {
      console.error('Error removing address:', error);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!customer) return;
    try {
      await setDefaultAddress({ customerId: customer.id, addressId }).unwrap();
    } catch (error) {
      console.error('Error setting default address:', error);
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

  const loyaltyCardStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    padding: spacing[6],
    marginBottom: spacing[6],
    background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
    color: '#fff',
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[2],
    marginBottom: spacing[6],
    borderBottom: `2px solid ${colors.surface.border}`,
    ...createCard('sm', 'base'),
    padding: spacing[2],
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.primary.main : colors.text.secondary,
    backgroundColor: isActive ? colors.surface.elevated : 'transparent',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...(isActive ? createNeumorphicSurface('raised', 'sm', 'base') : {}),
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
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    ...createNeumorphicSurface('inset', 'sm', 'base'),
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

  const nextTierInfo = getNextTierInfo(customer.loyaltyInfo.tier, customer.loyaltyInfo.totalPoints);

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          showPublicNav={true}
          onCartClick={handleCartClick}
        />

        <h1 style={titleStyles}>My Profile</h1>

        {/* Loyalty Card */}
        <div style={loyaltyCardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
            <div>
              <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[1] }}>
                {customer.loyaltyInfo.totalPoints}
              </div>
              <div style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>Loyalty Points</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={badgeStyles(getLoyaltyTierColor(customer.loyaltyInfo.tier))}>
                {customer.loyaltyInfo.tier}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, marginTop: spacing[1], opacity: 0.9 }}>
                Member since {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          {nextTierInfo && (
            <div>
              <div style={{ fontSize: typography.fontSize.sm, marginBottom: spacing[2], opacity: 0.9 }}>
                {nextTierInfo.pointsNeeded} points to {nextTierInfo.nextTier}
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full, overflow: 'hidden' }}>
                <div style={{
                  width: `${nextTierInfo.progress}%`,
                  height: '100%',
                  backgroundColor: '#fff',
                  transition: 'width 0.3s ease',
                }}></div>
              </div>
            </div>
          )}

          {/* Order Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4], marginTop: spacing[4], paddingTop: spacing[4], borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>{customer.orderStats.totalOrders}</div>
              <div style={{ fontSize: typography.fontSize.xs, opacity: 0.9 }}>Total Orders</div>
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>�{Math.round(customer.orderStats.totalSpent)}</div>
              <div style={{ fontSize: typography.fontSize.xs, opacity: 0.9 }}>Total Spent</div>
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>�{Math.round(customer.orderStats.averageOrderValue)}</div>
              <div style={{ fontSize: typography.fontSize.xs, opacity: 0.9 }}>Avg Order Value</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabsContainerStyles}>
          {['Personal Info', 'Addresses', 'Preferences'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(index);
                setEditing(false);
              }}
              style={tabButtonStyles(activeTab === index)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ ...createCard('md', 'base'), padding: spacing[6] }}>
          {activeTab === 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>Personal Information</h2>
                {!editing ? (
                  <Button variant="primary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                ) : (
                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleUpdateProfile}>Save</Button>
                  </div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={inputStyles}
                  />
                ) : (
                  <div style={{ fontSize: typography.fontSize.lg }}>{customer.name}</div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Email</label>
                <div style={{ fontSize: typography.fontSize.lg }}>
                  {customer.email} {customer.emailVerified && <span style={{ color: colors.success.main }}> Verified</span>}
                </div>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Phone</label>
                <div style={{ fontSize: typography.fontSize.lg }}>
                  {customer.phone} {customer.phoneVerified && <span style={{ color: colors.success.main }}> Verified</span>}
                </div>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Date of Birth</label>
                {editing ? (
                  <input
                    type="date"
                    value={profileForm.dateOfBirth || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    style={inputStyles}
                  />
                ) : (
                  <div style={{ fontSize: typography.fontSize.lg }}>{customer.dateOfBirth || 'Not set'}</div>
                )}
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Gender</label>
                {editing ? (
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
                ) : (
                  <div style={{ fontSize: typography.fontSize.lg }}>{customer.gender || 'Not set'}</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>My Addresses</h2>
                <Button variant="primary" size="sm" onClick={() => setAddressDialogOpen(true)}>Add Address</Button>
              </div>

              {customer.addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
                  No addresses saved. Add your first address to make ordering easier!
                </div>
              ) : (
                <div style={{ display: 'grid', gap: spacing[4] }}>
                  {customer.addresses.map((address) => (
                    <div key={address.id} style={{ ...createCard('sm', 'base'), padding: spacing[4] }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                        <div>
                          <span style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.lg }}>
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span style={{ ...badgeStyles(colors.primary.main), marginLeft: spacing[2] }}>Default</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2] }}>
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
              <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
                My Preferences
              </h2>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Spice Level</label>
                <div style={{ fontSize: typography.fontSize.lg }}>{customer.preferences.spiceLevel}</div>
              </div>

              {customer.preferences.favoriteMenuItems.length > 0 && (
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Favorite Items</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {customer.preferences.favoriteMenuItems.map((item, idx) => (
                      <span key={idx} style={badgeStyles(colors.primary.light)}>{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {customer.preferences.cuisinePreferences.length > 0 && (
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Cuisine Preferences</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {customer.preferences.cuisinePreferences.map((cuisine, idx) => (
                      <span key={idx} style={badgeStyles(colors.info.light)}>{cuisine}</span>
                    ))}
                  </div>
                </div>
              )}

              {customer.preferences.dietaryRestrictions.length > 0 && (
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Dietary Restrictions</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {customer.preferences.dietaryRestrictions.map((restriction, idx) => (
                      <span key={idx} style={badgeStyles(colors.warning.light)}>{restriction}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      {addressDialogOpen && (
        <div style={modalOverlayStyles} onClick={() => setAddressDialogOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
              Add New Address
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
              <Button variant="secondary" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleAddAddress}
                disabled={!addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.postalCode}
              >
                Add Address
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
