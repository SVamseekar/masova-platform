import React, { useState } from 'react';
import { useGetActiveStoresQuery } from '../store/api/storeApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedStore, selectSelectedStoreId, selectSelectedStoreName } from '../store/slices/cartSlice';
import { colors, spacing, typography } from '../styles/design-tokens';
import { createNeumorphicSurface } from '../styles/neumorphic-utils';

interface StoreSelectorProps {
  variant?: 'customer' | 'manager';
  onStoreChange?: (storeId: string, storeName: string) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ variant = 'customer', onStoreChange }) => {
  const dispatch = useAppDispatch();
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);
  const [isOpen, setIsOpen] = useState(false);

  const { data: stores = [], isLoading } = useGetActiveStoresQuery();

  const handleStoreSelect = (storeId: string, storeName: string) => {
    dispatch(setSelectedStore({ storeId, storeName }));
    setIsOpen(false);
    if (onStoreChange) {
      onStoreChange(storeId, storeName);
    }
  };

  const buttonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    padding: `${spacing[3]} ${spacing[4]}`,
    backgroundColor: selectedStoreId ? colors.brand.primary : colors.surface.primary,
    color: selectedStoreId ? colors.text.inverse : colors.text.primary,
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    position: 'relative',
    minWidth: variant === 'manager' ? '280px' : '220px',
    justifyContent: 'space-between',
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing[2],
    ...createNeumorphicSurface('raised', 'lg', 'lg'),
    backgroundColor: colors.surface.primary,
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000,
  };

  const storeItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: spacing[3],
    cursor: 'pointer',
    borderBottom: `1px solid ${colors.surface.tertiary}`,
    backgroundColor: isSelected ? colors.brand.primaryLight + '20' : 'transparent',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyles}
        disabled={isLoading}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <span style={{ fontSize: '18px' }}>🏪</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: typography.fontWeight.bold }}>
              {isLoading ? 'Loading...' : selectedStoreName || 'Select Store'}
            </div>
            {variant === 'manager' && selectedStoreId && (
              <div style={{ fontSize: typography.fontSize.xs, opacity: 0.8 }}>
                {selectedStoreId}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && !isLoading && (
        <div style={dropdownStyles}>
          {stores.length === 0 ? (
            <div style={{
              padding: spacing[4],
              textAlign: 'center',
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm,
            }}>
              No stores available
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreSelect(store.id, store.name)}
                style={storeItemStyles(selectedStoreId === store.id)}
                onMouseEnter={(e) => {
                  if (selectedStoreId !== store.id) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = colors.surface.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStoreId !== store.id) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}>
                  {selectedStoreId === store.id && (
                    <span style={{ color: colors.brand.primary, fontSize: '16px' }}>✓</span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div>{store.name}</div>
                    {variant === 'manager' && (
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.tertiary,
                        fontWeight: typography.fontWeight.normal,
                      }}>
                        {store.storeCode} • {store.id}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: '4px',
                    backgroundColor: store.status === 'OPEN' ? colors.semantic.successLight : colors.semantic.errorLight,
                    color: store.status === 'OPEN' ? colors.semantic.successDark : colors.semantic.errorDark,
                    fontWeight: typography.fontWeight.bold,
                  }}>
                    {store.status}
                  </span>
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}>
                  {store.address.street}, {store.address.city}
                </div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                  marginTop: spacing[1],
                }}>
                  {store.phoneNumber || 'No phone'} • {store.address.state} {store.address.pincode}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

export default StoreSelector;
