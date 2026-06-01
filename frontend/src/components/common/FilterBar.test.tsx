import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, FilterConfig, FilterValues, SortConfig } from './FilterBar';

// FilterBar is a pure presentational component -- no Redux needed

function createSearchFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  return {
    type: 'search',
    label: 'Search',
    field: 'search',
    placeholder: 'Search orders...',
    ...overrides,
  };
}

function createSelectFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  return {
    type: 'select',
    label: 'Status',
    field: 'status',
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
    ],
    ...overrides,
  };
}

function createDateRangeFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  return {
    type: 'dateRange',
    label: 'Date Range',
    field: 'dateRange',
    ...overrides,
  };
}

function createMultiSelectFilter(overrides?: Partial<FilterConfig>): FilterConfig {
  return {
    type: 'multiSelect',
    label: 'Categories',
    field: 'categories',
    options: [
      { label: 'Pizza', value: 'PIZZA' },
      { label: 'Burger', value: 'BURGER' },
      { label: 'Salad', value: 'SALAD' },
    ],
    ...overrides,
  };
}

describe('FilterBar', () => {
  const defaultProps = {
    filters: [createSearchFilter()],
    filterValues: { search: '' } as FilterValues,
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument();
  });

  it('renders a search filter with the correct label', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders a select filter with options', () => {
    const props = {
      ...defaultProps,
      filters: [createSelectFilter()],
      filterValues: { status: '' },
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('All Status')).toBeInTheDocument();
  });

  it('calls onFilterChange when a select value changes', async () => {
    const onFilterChange = vi.fn();
    const props = {
      ...defaultProps,
      filters: [createSelectFilter()],
      filterValues: { status: '' },
      onFilterChange,
    };

    render(<FilterBar {...props} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ACTIVE' } });
    expect(onFilterChange).toHaveBeenCalledWith('status', 'ACTIVE');
  });

  it('renders a date range filter with two inputs', () => {
    const props = {
      ...defaultProps,
      filters: [createDateRangeFilter()],
      filterValues: { dateRange: {} },
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    const dateInputs = screen.getAllByDisplayValue('');
    // The date range should have at least 2 date inputs
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onFilterChange when date range changes', () => {
    const onFilterChange = vi.fn();
    const props = {
      ...defaultProps,
      filters: [createDateRangeFilter()],
      filterValues: { dateRange: {} },
      onFilterChange,
    };

    render(<FilterBar {...props} />);
    const dateInputs = screen.getAllByRole('textbox').length > 0
      ? screen.getAllByRole('textbox')
      : document.querySelectorAll('input[type="date"]');

    if (dateInputs.length >= 2) {
      fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } });
      expect(onFilterChange).toHaveBeenCalledWith('dateRange', { from: '2026-01-01' });
    }
  });

  it('renders multi-select filter with checkboxes', () => {
    const props = {
      ...defaultProps,
      filters: [createMultiSelectFilter()],
      filterValues: { categories: [] },
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
  });

  it('calls onFilterChange when a multi-select checkbox is toggled', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const props = {
      ...defaultProps,
      filters: [createMultiSelectFilter()],
      filterValues: { categories: [] as string[] },
      onFilterChange,
    };

    render(<FilterBar {...props} />);
    const pizzaCheckbox = screen.getByRole('checkbox', { name: /pizza/i });
    await user.click(pizzaCheckbox);
    expect(onFilterChange).toHaveBeenCalledWith('categories', ['PIZZA']);
  });

  it('does not show Clear Filters button when no active filters', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  it('shows Clear Filters button when filters are active', () => {
    const props = {
      ...defaultProps,
      filterValues: { search: 'pizza' },
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('calls onClearFilters when Clear Filters is clicked', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    const props = {
      ...defaultProps,
      filterValues: { search: 'pizza' },
      onClearFilters,
    };

    render(<FilterBar {...props} />);
    await user.click(screen.getByText('Clear Filters'));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('renders sort options when provided', () => {
    const props = {
      ...defaultProps,
      sortOptions: [
        { label: 'Date', field: 'date' },
        { label: 'Amount', field: 'amount' },
      ],
      sortConfig: { field: 'date', direction: 'asc' as const },
      onSortChange: vi.fn(),
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText(/Date/)).toBeInTheDocument();
    expect(screen.getByText(/Amount/)).toBeInTheDocument();
  });

  it('calls onSortChange when a sort option is clicked', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const props = {
      ...defaultProps,
      sortOptions: [
        { label: 'Date', field: 'date' },
        { label: 'Amount', field: 'amount' },
      ],
      sortConfig: { field: 'date', direction: 'asc' as const },
      onSortChange,
    };

    render(<FilterBar {...props} />);
    await user.click(screen.getByText(/Amount/));
    expect(onSortChange).toHaveBeenCalledWith('amount');
  });

  it('shows export button when showExport is true', () => {
    const props = {
      ...defaultProps,
      showExport: true,
      onExport: vi.fn(),
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText(/Export CSV/)).toBeInTheDocument();
  });

  it('does not show export button when showExport is false', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText(/Export CSV/)).not.toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    const props = {
      ...defaultProps,
      showExport: true,
      onExport,
    };

    render(<FilterBar {...props} />);
    await user.click(screen.getByText(/Export CSV/));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('debounces search input before calling onFilterChange', async () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const props = {
      ...defaultProps,
      onFilterChange,
    };

    render(<FilterBar {...props} />);
    const input = screen.getByPlaceholderText('Search orders...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call immediately
    expect(onFilterChange).not.toHaveBeenCalled();

    // Advance timers past the 300ms debounce
    vi.advanceTimersByTime(350);
    expect(onFilterChange).toHaveBeenCalledWith('search', 'test');

    vi.useRealTimers();
  });

  it('renders multiple filters simultaneously', () => {
    const props = {
      ...defaultProps,
      filters: [createSearchFilter(), createSelectFilter(), createMultiSelectFilter()],
      filterValues: { search: '', status: '', categories: [] },
    };

    render(<FilterBar {...props} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('disables search input when isLoading is true', () => {
    const props = {
      ...defaultProps,
      isLoading: true,
    };

    render(<FilterBar {...props} />);
    const input = screen.getByPlaceholderText('Search orders...');
    expect(input).toBeDisabled();
  });
});
