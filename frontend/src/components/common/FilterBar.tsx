import React, { useState, useEffect } from 'react';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

export interface FilterConfig {
  type: 'search' | 'select' | 'dateRange' | 'multiSelect';
  label: string;
  field: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | string[] | { from?: string; to?: string };
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterBarProps {
  filters: FilterConfig[];
  filterValues: FilterValues;
  onFilterChange: (field: string, value: string | string[] | { from?: string; to?: string }) => void;
  onClearFilters: () => void;
  sortConfig?: SortConfig;
  onSortChange?: (field: string) => void;
  sortOptions?: Array<{ label: string; field: string }>;
  onExport?: () => void;
  showExport?: boolean;
  isLoading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  sortConfig,
  onSortChange,
  sortOptions,
  onExport,
  showExport = false,
  isLoading = false,
}) => {
  const surface = createNeumorphicSurface();

  // State for debounced search
  const [searchValue, setSearchValue] = useState('');
  const [dateError, setDateError] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const searchFilter = filters.find(f => f.type === 'search');
    if (!searchFilter) return;

    const timer = setTimeout(() => {
      if (searchValue !== filterValues[searchFilter.field]) {
        onFilterChange(searchFilter.field, searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, filterValues, onFilterChange]);

  // Sync search value when filters are cleared
  useEffect(() => {
    const searchFilter = filters.find(f => f.type === 'search');
    if (searchFilter && filterValues[searchFilter.field] === '') {
      setSearchValue('');
    }
  }, [filterValues, filters]);

  const hasActiveFilters = Object.values(filterValues).some((value) => {
    if (typeof value === 'string') return value !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return value.from || value.to;
    return false;
  });

  // Validate date range
  const validateDateRange = (from?: string, to?: string): boolean => {
    if (!from || !to) {
      setDateError('');
      return true;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate > toDate) {
      setDateError('Start date must be before end date');
      return false;
    }

    setDateError('');
    return true;
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = filterValues[filter.field];

    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.field} style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {filter.label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={filter.placeholder || 'Search...'}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  backgroundColor: isLoading ? '#f8fafc' : '#ffffff',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  cursor: isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.05)';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '1rem',
                }}
              >
                ⌕
              </span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.field} style={{ flex: 1, minWidth: '180px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {filter.label}
            </label>
            <select
              value={(value as string) || ''}
              onChange={(e) => onFilterChange(filter.field, e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              <option value="">All {filter.label}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'dateRange':
        const dateValue = (value as { from?: string; to?: string }) || {};
        return (
          <div key={filter.field} style={{ flex: '1 1 auto', minWidth: '280px', maxWidth: '380px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {filter.label}
            </label>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <input
                type="date"
                value={dateValue.from || ''}
                onChange={(e) => {
                  const newValue = { ...dateValue, from: e.target.value };
                  validateDateRange(newValue.from, newValue.to);
                  onFilterChange(filter.field, newValue);
                }}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.5rem',
                  border: `2px solid ${dateError ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  backgroundColor: isLoading ? '#f8fafc' : '#ffffff',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  cursor: isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = dateError ? '#ef4444' : '#3b82f6';
                    e.target.style.boxShadow = `0 0 0 3px rgba(${dateError ? '239, 68, 68' : '59, 130, 246'}, 0.1)`;
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = dateError ? '#ef4444' : '#e2e8f0';
                  e.target.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.05)';
                }}
              />
              <span style={{ color: '#94a3b8' }}>→</span>
              <input
                type="date"
                value={dateValue.to || ''}
                onChange={(e) => {
                  const newValue = { ...dateValue, to: e.target.value };
                  validateDateRange(newValue.from, newValue.to);
                  onFilterChange(filter.field, newValue);
                }}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.5rem',
                  border: `2px solid ${dateError ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  backgroundColor: isLoading ? '#f8fafc' : '#ffffff',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  cursor: isLoading ? 'not-allowed' : 'text',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  if (!isLoading) {
                    e.target.style.borderColor = dateError ? '#ef4444' : '#3b82f6';
                    e.target.style.boxShadow = `0 0 0 3px rgba(${dateError ? '239, 68, 68' : '59, 130, 246'}, 0.1)`;
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = dateError ? '#ef4444' : '#e2e8f0';
                  e.target.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.05)';
                }}
              />
            </div>
            {dateError && (
              <div style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem',
                fontWeight: 500
              }}>
                {dateError}
              </div>
            )}
          </div>
        );

      case 'multiSelect':
        const multiValue = (value as string[]) || [];
        return (
          <div key={filter.field} style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {filter.label}
            </label>
            <div
              style={{
                padding: '0.5rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {filter.options?.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={multiValue.includes(opt.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...multiValue, opt.value]
                        : multiValue.filter((v) => v !== opt.value);
                      onFilterChange(filter.field, newValue);
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        ...surface,
        padding: '1rem',
        marginBottom: '1.5rem',
        maxWidth: 'calc(100vw - 3rem)',
        margin: '0 1.5rem 1.5rem 1.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Filters Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {filters.map(renderFilter)}
      </div>

      {/* Actions Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Sort Controls */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Sort by:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sortOptions.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => onSortChange(opt.field)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor:
                      sortConfig?.field === opt.field ? '#3b82f6' : '#ffffff',
                    color: sortConfig?.field === opt.field ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow:
                      sortConfig?.field === opt.field
                        ? '0 4px 6px rgba(59, 130, 246, 0.3)'
                        : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (sortConfig?.field !== opt.field) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortConfig?.field !== opt.field) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  {opt.label}
                  {sortConfig?.field === opt.field && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              style={{
                padding: '0.5rem 1.25rem',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: '#fffbeb',
                color: '#f59e0b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3c7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fffbeb';
              }}
            >
              Clear Filters
            </button>
          )}

          {showExport && onExport && (
            <button
              onClick={onExport}
              style={{
                padding: '0.5rem 1.25rem',
                border: '2px solid #10b981',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: '#d1fae5',
                color: '#10b981',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#a7f3d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#d1fae5';
              }}
            >
              ⬇ Export CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
