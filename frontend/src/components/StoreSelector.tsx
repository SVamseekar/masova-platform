import React, { useState, useEffect } from 'react';
import { useGetActiveStoresQuery } from '../store/api/storeApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedStore, selectSelectedStoreId, selectSelectedStoreName } from '../store/slices/cartSlice';
import { colors, spacing, typography } from '../styles/design-tokens';
import { createNeumorphicSurface } from '../styles/neumorphic-utils';
import { getTabStore, setTabStore } from '../utils/tabStorage';

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Checks if a store is currently open based on operatingHours
function isStoreOpen(store: any): boolean {
  if (!store.operatingHours) return true; // assume open if no hours data
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const hours = store.operatingHours[today];
  if (!hours?.isOpen && hours?.isOpen !== undefined) return false;
  if (!hours?.open && !hours?.startTime) return true; // no hours = assume open
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openStr = hours.open ?? hours.startTime ?? '00:00';
  const closeStr = hours.close ?? hours.endTime ?? '23:59';
  const [oh, om] = openStr.split(':').map(Number);
  const [ch, cm] = closeStr.split(':').map(Number);
  return currentMins >= oh * 60 + om && currentMins <= ch * 60 + cm;
}

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

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

  // Auto-detect nearest open store via browser Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });

        // Auto-select nearest OPEN store only if nothing is currently selected
        if (!selectedStoreId && stores.length > 0) {
          const withDistance = stores
            .filter((s: any) => s.address?.latitude && s.address?.longitude)
            .map((s: any) => ({
              store: s,
              dist: haversineKm(latitude, longitude, s.address.latitude, s.address.longitude),
              open: isStoreOpen(s),
            }))
            .filter(x => x.open)
            .sort((a, b) => a.dist - b.dist);

          if (withDistance.length > 0) {
            const nearest = withDistance[0].store;
            handleStoreSelect(nearest.storeCode ?? nearest.id, nearest.name);
          }
        }
      },
      () => { /* silently fail if user denies location */ },
      { timeout: 5000, maximumAge: 60000 }
    );
  }, [stores.length]); // run once when stores load

  const buttonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'md'),
    padding: `${spacing[2]} ${spacing[4]}`,
    background: colors.surface.primary,
    color: colors.text.primary,
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    position: 'relative',
    minWidth: variant === 'manager' ? '180px' : '180px',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    height: '36px',
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing[2],
    minWidth: '320px',
    ...createNeumorphicSurface('raised', 'lg', 'xl'),
    backgroundColor: colors.surface.primary,
    maxHeight: '360px',
    overflowY: 'auto',
    zIndex: 9999,
  };

  const storeItemStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'flat', 'sm', 'md'),
    padding: `${spacing[3]} ${spacing[4]}`,
    margin: `${spacing[2]} ${spacing[3]}`,
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.surface.secondary : colors.surface.primary,
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
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.sm,
              color: selectedStoreId ? colors.text.primary : colors.text.secondary,
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
            ([...stores].sort((a: any, b: any) => {
              if (!userLocation) return 0;
              const da = a.address?.latitude ? haversineKm(userLocation.lat, userLocation.lon, a.address.latitude, a.address.longitude) : 999;
              const db = b.address?.latitude ? haversineKm(userLocation.lat, userLocation.lon, b.address.latitude, b.address.longitude) : 999;
              return da - db;
            })).map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreSelect(store.storeCode, store.name)}
                style={storeItemStyles(selectedStoreId === store.storeCode)}
                onMouseEnter={(e) => {
                  if (selectedStoreId !== store.storeCode) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = colors.surface.secondary;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStoreId !== store.storeCode) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = colors.surface.primary;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing[3],
                }}>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                  }}>
                    {selectedStoreId === store.storeCode && (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: colors.brand.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#ffffff',
                        flexShrink: 0,
                      }}>
                        ✓
                      </div>
                    )}
                    {!selectedStoreId || selectedStoreId !== store.storeCode ? (
                      <div style={{ width: '16px', flexShrink: 0 }} />
                    ) : null}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                        }}>
                          {store.name}
                        </span>
                        {userLocation && (store as any).address?.latitude && (
                          <span style={{ fontSize: '11px', color: colors.text.tertiary }}>
                            {haversineKm(userLocation.lat, userLocation.lon, (store as any).address.latitude, (store as any).address.longitude).toFixed(1)} km
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isStoreOpen(store) ? '#dcfce7' : '#fee2e2',
                          color: isStoreOpen(store) ? '#16a34a' : '#dc2626',
                        }}>
                          {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.tertiary,
                      }}>
                        {store.address.city}, {store.address.state}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    padding: `4px ${spacing[3]}`,
                    borderRadius: '12px',
                    backgroundColor: store.status === 'ACTIVE' ? '#d1fae5' : colors.semantic.errorLight,
                    color: store.status === 'ACTIVE' ? '#065f46' : colors.semantic.error,
                    fontWeight: typography.fontWeight.bold,
                    flexShrink: 0,
                    textTransform: 'capitalize',
                  }}>
                    {store.status.toLowerCase()}
                  </span>
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
