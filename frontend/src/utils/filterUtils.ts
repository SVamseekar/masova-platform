import { FilterValues, SortConfig } from '../components/common/FilterBar';

/**
 * Generic filter function that applies multiple filter criteria to a dataset
 */
type FilterFieldValue = FilterValues[string];
type NestedFieldValue = string | number | boolean | null | undefined;

function isDateRangeValue(
  value: FilterFieldValue
): value is { from?: string; to?: string } {
  return typeof value === 'object' && !Array.isArray(value) && value !== null;
}

function toDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function applyFilters<T extends object>(
  data: T[],
  filterValues: FilterValues,
  filterConfig: {
    [field: string]: (item: T, value: FilterFieldValue) => boolean;
  }
): T[] {
  return data.filter((item) => {
    return Object.entries(filterValues).every(([field, value]) => {
      // Skip empty filters
      if (!value) return true;
      if (typeof value === 'string' && value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !value.from &&
        !value.to
      )
        return true;

      // Apply custom filter if defined
      if (filterConfig[field]) {
        return filterConfig[field](item, value);
      }

      // Default filter behavior
      if (typeof value === 'string') {
        const itemValue = getNestedValue(item, field);
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }

      if (Array.isArray(value)) {
        const itemValue = getNestedValue(item, field);
        return value.includes(String(itemValue));
      }

      if (typeof value === 'object' && (value.from || value.to)) {
        const itemValue = getNestedValue(item, field);
        if (!itemValue) return true;

        // Normalize dates to midnight for consistent comparison
        const itemDate = toDateValue(itemValue);
        if (!itemDate) return true;
        itemDate.setHours(0, 0, 0, 0);

        if (value.from && value.to) {
          const fromDate = new Date(value.from);
          fromDate.setHours(0, 0, 0, 0);

          const toDate = new Date(value.to);
          toDate.setHours(23, 59, 59, 999);

          return itemDate >= fromDate && itemDate <= toDate;
        } else if (value.from) {
          const fromDate = new Date(value.from);
          fromDate.setHours(0, 0, 0, 0);
          return itemDate >= fromDate;
        } else if (value.to) {
          const toDate = new Date(value.to);
          toDate.setHours(23, 59, 59, 999);
          return itemDate <= toDate;
        }
      }

      return true;
    });
  });
}

/**
 * Generic sort function that applies sorting to a dataset
 */
export function applySort<T extends object>(
  data: T[],
  sortConfig?: SortConfig
): T[] {
  if (!sortConfig) return data;

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortConfig.field);
    const bValue = getNestedValue(b, sortConfig.field);

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Numeric comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Date comparison
    const aDate = toDateValue(aValue);
    const bDate = toDateValue(bValue);
    if (aDate && bDate) {
      return sortConfig.direction === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // Default: convert to string and compare
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
}

/**
 * Get nested value from object using dot notation (e.g., 'user.name')
 */
export function getNestedValue(obj: object, path: string): NestedFieldValue {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as Record<string, unknown>);

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return value;
  }

  return String(value);
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns: {
    label: string;
    field: string;
    format?: (value: NestedFieldValue, row?: T) => string | number | boolean | null | undefined;
  }[]
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map((col) => col.label);
  const csvRows = [headers.join(',')];

  // Create CSV rows
  data.forEach((item) => {
    const values = columns.map((col) => {
      const value = getNestedValue(item, col.field);
      const formattedValue = col.format ? col.format(value, item) : value;

      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(formattedValue ?? '');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Common filter configurations for reuse
 */
export const commonFilters = {
  searchText: <T extends object>(
    item: T,
    value: string,
    fields: string[]
  ): boolean => {
    const searchLower = value.toLowerCase();
    return fields.some((field) => {
      const fieldValue = getNestedValue(item, field);
      return String(fieldValue).toLowerCase().includes(searchLower);
    });
  },

  status: <T extends object>(
    item: T,
    value: string,
    statusField: string = 'status'
  ): boolean => {
    return getNestedValue(item, statusField) === value;
  },

  dateRange: <T extends object>(
    item: T,
    value: FilterFieldValue,
    dateField: string
  ): boolean => {
    if (!isDateRangeValue(value)) {
      return true;
    }

    const itemDateValue = getNestedValue(item, dateField);
    if (!itemDateValue) return true;

    // Normalize all dates to midnight UTC for consistent comparison
    const itemDate = toDateValue(itemDateValue);
    if (!itemDate) return true;
    itemDate.setHours(0, 0, 0, 0);

    if (value.from && value.to) {
      const fromDate = new Date(value.from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(value.to);
      toDate.setHours(23, 59, 59, 999);

      return itemDate >= fromDate && itemDate <= toDate;
    } else if (value.from) {
      const fromDate = new Date(value.from);
      fromDate.setHours(0, 0, 0, 0);
      return itemDate >= fromDate;
    } else if (value.to) {
      const toDate = new Date(value.to);
      toDate.setHours(23, 59, 59, 999);
      return itemDate <= toDate;
    }

    return true;
  },

  multiSelect: <T extends object>(
    item: T,
    value: string[],
    field: string
  ): boolean => {
    return value.includes(String(getNestedValue(item, field)));
  },
};
