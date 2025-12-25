import React, { useState, useEffect } from 'react';
import { useGetActiveStoresQuery } from '../store/api/storeApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedStore, selectSelectedStoreId, selectSelectedStoreName } from '../store/slices/cartSlice';
import { colors, spacing, typography } from '../styles/design-tokens';
import { createNeumorphicSurface } from '../styles/neumorphic-utils';
import { getTabStore, setTabStore } from '../utils/tabStorage';

interface StoreSelectorProps {
  variant?: 'customer' | 'manager';
  onStoreChange?: (storeId: string, storeName: string) => void;
  contextKey?: string; // If provided, uses page-specific context instead of global Redux
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ variant = 'customer', onStoreChange, contextKey }) => {
  const dispatch = useAppDispatch();

  // Use tabStorage-based store selection if contextKey is provided, otherwise use Redux
  const useLocalStorage = !!contextKey;

  const reduxStoreId = useAppSelector(selectSelectedStoreId);
  const reduxStoreName = useAppSelector(selectSelectedStoreName);

  // State for page-specific store selection (when contextKey is provided)
  const [localStoreId, setLocalStoreId] = useState<string>(() => {
    if (contextKey) {
      const stored = getTabStore(contextKey);
      return stored?.storeId || '';
    }
    return '';
  });

  const [localStoreName, setLocalStoreName] = useState<string>(() => {
    if (contextKey) {
      const stored = getTabStore(contextKey);
      return stored?.storeName || '';
    }
    return '';
  });

  const selectedStoreId = useLocalStorage ? localStoreId : reduxStoreId;
  const selectedStoreName = useLocalStorage ? localStoreName : reduxStoreName;

  const [isOpen, setIsOpen] = useState(false);

  const { data: stores = [], isLoading } = useGetActiveStoresQuery();

  const handleStoreSelect = (storeId: string, storeName: string) => {
    // ALWAYS update Redux for API headers
    dispatch(setSelectedStore({ storeId, storeName }));

    if (useLocalStorage && contextKey) {
      // ALSO use page-specific tabStorage for local state
      setTabStore(contextKey, storeId, storeName);
      setLocalStoreId(storeId);
      setLocalStoreName(storeName);
    }

    // RTK Query will automatically refetch when storeId parameter changes
    // No need for manual invalidation - this prevents rate limiting

    setIsOpen(false);
    if (onStoreChange) {
      onStoreChange(storeId, storeName);
    }
  };

  const buttonStyles: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[4]}`,
    background: variant === 'manager'
      ? `linear-gradient(145deg, #2d2d2d, #1f1f1f)`
      : `linear-gradient(145deg, #e8e8e8, #d4d4d4)`,
    color: variant === 'manager' ? '#ffffff' : colors.text.primary,
    border: variant === 'manager'
      ? `1px solid ${selectedStoreId ? colors.brand.primary : 'rgba(255, 255, 255, 0.2)'}`
      : `2px solid ${selectedStoreId ? colors.brand.primary : colors.surface.border}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    position: 'relative',
    minWidth: variant === 'manager' ? '200px' : '180px',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    borderRadius: '8px',
    height: '40px',
    boxShadow: variant === 'manager'
      ? `
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 rgba(0, 0, 0, 0.4),
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 2px 4px rgba(0, 0, 0, 0.2)
      `
      : selectedStoreId
        ? `0 2px 8px ${colors.brand.primary}22, 0 1px 4px rgba(0,0,0,0.1)`
        : '0 2px 4px rgba(0,0,0,0.08)',
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
    zIndex: 9999,
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
          <span style={{ fontSize: '16px' }}>🏪</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize.sm,
              color: selectedStoreId ? colors.brand.primary : colors.text.secondary,
            }}>
              {isLoading ? 'Loading...' : selectedStoreName || 'Select Store'}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '10px', color: colors.text.tertiary }}>{isOpen ? '▲' : '▼'}</span>
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
                onClick={() => handleStoreSelect(store.storeCode, store.name)}
                style={storeItemStyles(selectedStoreId === store.storeCode)}
                onMouseEnter={(e) => {
                  if (selectedStoreId !== store.storeCode) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = colors.surface.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStoreId !== store.storeCode) {
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
                  {selectedStoreId === store.storeCode && (
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
                    backgroundColor: store.status === 'ACTIVE' ? colors.semantic.successLight : colors.semantic.errorLight,
                    color: store.status === 'ACTIVE' ? colors.semantic.successDark : colors.semantic.errorDark,
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
            zIndex: 9998,
          }}
        />
      )}
    </div>
  );
};

export default StoreSelector;
