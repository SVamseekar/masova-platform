import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { useGeocoding } from '../../hooks/useGeocoding';
import { colors, spacing, typography, shadows } from '../../styles/design-tokens';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const LIBRARIES: ('places')[] = ['places'];

interface AddressAutocompleteProps {
  onSelect: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
}

interface NominatimSuggestion {
  displayName: string;
  lat: number;
  lon: number;
  placeId: string;
}

// ─── Google Places variant ───────────────────────────────────────────────────

const GooglePlacesAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelect,
  placeholder = 'Enter delivery address...',
  initialValue = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const handlePlacesChanged = useCallback(() => {
    const places = searchBoxRef.current?.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    const address = place.formatted_address ?? place.name ?? '';
    const lat = place.geometry?.location?.lat() ?? 0;
    const lon = place.geometry?.location?.lng() ?? 0;
    setInputValue(address);
    onSelect(address, lat, lon);
  }, [onSelect]);

  return (
    <StandaloneSearchBox
      onLoad={(ref) => { searchBoxRef.current = ref; }}
      onPlacesChanged={handlePlacesChanged}
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: `${spacing[3]} ${spacing[4]}`,
          borderRadius: '10px',
          border: `2px solid ${colors.surface.border}`,
          outline: 'none',
          backgroundColor: disabled ? colors.surface.secondary : colors.surface.primary,
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
          fontFamily: typography.fontFamily.primary,
          boxShadow: shadows.inset.sm,
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      />
    </StandaloneSearchBox>
  );
};

// ─── Nominatim fallback variant ──────────────────────────────────────────────

const NominatimAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelect,
  placeholder = 'Enter delivery address...',
  initialValue = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const { geocode, loading } = useGeocoding();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (value.length >= 3) {
        try {
          const result = await geocode(value);
          if (result) {
            setSuggestions([{
              displayName: result.displayName,
              lat: result.latitude,
              lon: result.longitude,
              placeId: `${result.latitude}-${result.longitude}`,
            }]);
            setShowSuggestions(true);
          }
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
  };

  const handleSelect = (s: NominatimSuggestion) => {
    setInputValue(s.displayName);
    setShowSuggestions(false);
    onSelect(s.displayName, s.lat, s.lon);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: `${spacing[3]} ${spacing[4]}`,
            paddingRight: loading ? spacing[10] : spacing[4],
            borderRadius: '10px',
            border: `2px solid ${colors.surface.border}`,
            outline: 'none',
            backgroundColor: disabled ? colors.surface.secondary : colors.surface.primary,
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            fontFamily: typography.fontFamily.primary,
            boxShadow: shadows.inset.sm,
            transition: 'all 0.2s ease',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: spacing[3],
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
          }}>...</div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: colors.surface.primary,
          border: `1px solid ${colors.surface.border}`,
          borderRadius: '10px',
          marginTop: spacing[1],
          padding: 0,
          listStyle: 'none',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: shadows.raised.lg,
        }}>
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              onClick={() => handleSelect(s)}
              style={{
                padding: spacing[3],
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.surface.border}`,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surface.secondary; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ fontWeight: typography.fontWeight.medium }}>
                {s.displayName}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Wrapper: use Google Places when API key present, else Nominatim ─────────

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = (props) => {
  const hasGoogleKey = !!GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    // If no key, the hook still works but won't load Google Maps
  });

  if (hasGoogleKey && isLoaded) {
    return <GooglePlacesAutocomplete {...props} />;
  }

  return <NominatimAutocomplete {...props} />;
};

export default AddressAutocomplete;
