import { FilterValues, SortConfig } from '../components/common/FilterBar';

/**
 * Generic filter function that applies multiple filter criteria to a dataset
 */
export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filterValues: FilterValues,
  filterConfig: {
    [field: string]: (item: T, value: any) => boolean;
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
        const itemDate = new Date(itemValue);
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
export function applySort<T extends Record<string, any>>(
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
    const aDate = new Date(aValue);
    const bDate = new Date(bValue);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
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
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { label: string; field: string; format?: (value: any) => string }[]
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
      const formattedValue = col.format ? col.format(value) : value;

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
  searchText: <T extends Record<string, any>>(
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

  status: <T extends Record<string, any>>(
    item: T,
    value: string,
    statusField: string = 'status'
  ): boolean => {
    return getNestedValue(item, statusField) === value;
  },

  dateRange: <T extends Record<string, any>>(
    item: T,
    value: { from?: string; to?: string },
    dateField: string
  ): boolean => {
    const itemDateValue = getNestedValue(item, dateField);
    if (!itemDateValue) return true;

    // Normalize all dates to midnight UTC for consistent comparison
    const itemDate = new Date(itemDateValue);
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

  multiSelect: <T extends Record<string, any>>(
    item: T,
    value: string[],
    field: string
  ): boolean => {
    return value.includes(String(getNestedValue(item, field)));
  },
};
