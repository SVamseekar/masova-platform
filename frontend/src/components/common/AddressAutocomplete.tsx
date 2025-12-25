import React, { useState, useEffect, useRef } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { colors, spacing, typography, shadows } from '../../styles/design-tokens';

interface AddressAutocompleteProps {
  onSelect: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
}

interface Suggestion {
  displayName: string;
  lat: number;
  lon: number;
  placeId: string;
}

/**
 * Address Autocomplete Component using Nominatim (OpenStreetMap)
 * - Free geocoding API
 * - No API key required
 * - Dropdown suggestions
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelect,
  placeholder = "Enter delivery address...",
  initialValue = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { geocode, loading } = useGeocoding();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      if (value.length >= 3) {
        try {
          const result = await geocode(value);
          if (result) {
            // For now, we only get one result from geocode
            // In a full implementation, you'd call Nominatim search endpoint directly
            setSuggestions([{
              displayName: result.displayName,
              lat: result.latitude,
              lon: result.longitude,
              placeId: `${result.latitude}-${result.longitude}`,
            }]);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // 500ms debounce
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: Suggestion) => {
    setInputValue(suggestion.displayName);
    setShowSuggestions(false);
    onSelect(suggestion.displayName, suggestion.lat, suggestion.lon);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            right: spacing[3],
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: typography.fontSize.base,
          }}>
            ⏳
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
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
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.placeId}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: spacing[3],
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.surface.border}`,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: typography.fontWeight.medium }}>
                📍 {suggestion.displayName}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
