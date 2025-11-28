import React from 'react';
import { useGetStoreQuery } from '../store/api/storeApi';
import { colors, spacing, typography } from '../styles/design-tokens';
import { createNeumorphicSurface } from '../styles/neumorphic-utils';

interface StoreInfoProps {
  storeId: string;
  variant?: 'compact' | 'detailed';
}

const StoreInfo: React.FC<StoreInfoProps> = ({ storeId, variant = 'compact' }) => {
  const { data: store, isLoading } = useGetStoreQuery(storeId, { skip: !storeId });

  if (isLoading) {
    return (
      <div style={{
        ...createNeumorphicSurface('inset', 'sm', 'base'),
        padding: spacing[3],
        textAlign: 'center',
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
      }}>
        Loading store information...
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const containerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: spacing[4],
    backgroundColor: colors.surface.primary,
    borderLeft: `4px solid ${colors.brand.primary}`,
  };

  if (variant === 'compact') {
    return (
      <div style={containerStyles}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing[1],
            }}>
              {store.name}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>
              {store.address.street}, {store.address.city}
            </div>
          </div>
          <span style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
            padding: `${spacing[1]} ${spacing[2]}`,
            borderRadius: '4px',
            backgroundColor: store.status === 'OPEN' ? colors.semantic.successLight : colors.semantic.errorLight,
            color: store.status === 'OPEN' ? colors.semantic.successDark : colors.semantic.errorDark,
          }}>
            {store.status}
          </span>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div style={containerStyles}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing[4],
        marginBottom: spacing[4],
      }}>
        <span style={{ fontSize: '32px' }}>🏪</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.extrabold,
            color: colors.text.primary,
            marginBottom: spacing[2],
          }}>
            {store.name}
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.tertiary,
            marginBottom: spacing[1],
          }}>
            Store Code: {store.storeCode}
          </div>
        </div>
        <span style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.bold,
          padding: `${spacing[2]} ${spacing[3]}`,
          borderRadius: '8px',
          backgroundColor: store.status === 'OPEN' ? colors.semantic.successLight : colors.semantic.errorLight,
          color: store.status === 'OPEN' ? colors.semantic.successDark : colors.semantic.errorDark,
        }}>
          {store.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
        <div>
          <div style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wide,
            marginBottom: spacing[1],
          }}>
            Address
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            lineHeight: typography.lineHeight.relaxed,
          }}>
            {store.address.street}<br />
            {store.address.city}, {store.address.state}<br />
            {store.address.pincode}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wide,
            marginBottom: spacing[1],
          }}>
            Contact
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
          }}>
            {store.phoneNumber || 'No phone number'}
          </div>
        </div>

        {store.operatingConfig && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
              marginBottom: spacing[2],
            }}>
              Store Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[3] }}>
              <div>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Delivery Radius:
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.primary, marginLeft: spacing[1] }}>
                  {store.operatingConfig.deliveryRadiusKm}km
                </span>
              </div>
              <div>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Min Order:
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.primary, marginLeft: spacing[1] }}>
                  ₹{store.operatingConfig.minimumOrderValueINR}
                </span>
              </div>
              <div>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Prep Time:
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.primary, marginLeft: spacing[1] }}>
                  ~{store.operatingConfig.estimatedPrepTimeMinutes}min
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreInfo;
