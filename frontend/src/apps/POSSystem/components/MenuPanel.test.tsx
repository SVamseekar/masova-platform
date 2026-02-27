import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { mockMenuItems } from '@/test/fixtures/mockMenu';
import MenuPanel from './MenuPanel';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

let mockMenuData: any[] = [];
let mockIsLoading = false;
let mockError: any = null;
const mockRefetch = vi.fn();

vi.mock('../../../store/api/menuApi', async () => {
  const actual = await vi.importActual<any>('../../../store/api/menuApi');
  return {
    ...actual,
    useGetAvailableMenuQuery: () => ({
      data: mockMenuData,
      isLoading: mockIsLoading,
      error: mockError,
      refetch: mockRefetch,
    }),
  };
});

const defaultCartState = {
  cart: {
    items: [],
    selectedStoreId: 'store-1',
    selectedStoreName: 'Downtown Branch',
    totalItems: 0,
  },
};

describe('MenuPanel', () => {
  const mockOnAddItem = vi.fn();

  beforeEach(() => {
    mockOnAddItem.mockClear();
    mockRefetch.mockClear();
    mockMenuData = mockMenuItems;
    mockIsLoading = false;
    mockError = null;
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(screen.getByText('Menu Items')).toBeInTheDocument();
    });

    it('displays the search input', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(
        screen.getByPlaceholderText('Search menu items...')
      ).toBeInTheDocument();
    });

    it('renders cuisine tabs', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(screen.getByText('SOUTH INDIAN')).toBeInTheDocument();
      expect(screen.getByText('NORTH INDIAN')).toBeInTheDocument();
      expect(screen.getByText('ITALIAN')).toBeInTheDocument();
    });

    it('renders dietary filter buttons', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(screen.getAllByText('All').length).toBeGreaterThan(0);
      expect(screen.getByText(/Veg$/)).toBeInTheDocument();
      expect(screen.getByText(/Vegan/)).toBeInTheDocument();
      expect(screen.getByText(/Non-Veg/)).toBeInTheDocument();
    });

    it('shows item count in footer', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(screen.getByText(/items available/)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when menu is loading', () => {
      mockIsLoading = true;
      mockMenuData = [];

      const { container } = renderWithProviders(
        <MenuPanel onAddItem={mockOnAddItem} />,
        {
          useMemoryRouter: true,
          preloadedState: defaultCartState as any,
        }
      );

      const spinner = container.querySelector('[style*="animation"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when menu fails to load', () => {
      mockError = { message: 'Network error' };
      mockMenuData = [];

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(
        screen.getByText(/Failed to load menu items/i)
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when no items match filters', () => {
      mockMenuData = [];

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      expect(
        screen.getByText(/No available items in this category/i)
      ).toBeInTheDocument();
    });
  });

  describe('cuisine filtering', () => {
    it('defaults to South Indian cuisine', () => {
      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      // South Indian items (Masala Dosa) should be visible
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    });

    it('filters items when a different cuisine is selected', async () => {
      const user = userEvent.setup();

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      await user.click(screen.getByText('ITALIAN'));

      // Italian items should be visible
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      // South Indian items should not
      expect(screen.queryByText('Masala Dosa')).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters items by search term', async () => {
      const user = userEvent.setup();

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      // Switch to Italian to see Pizza
      await user.click(screen.getByText('ITALIAN'));
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      await user.type(searchInput, 'Margherita');

      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    });

    it('shows no results message for non-matching search', async () => {
      const user = userEvent.setup();

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      const searchInput = screen.getByPlaceholderText('Search menu items...');
      await user.type(searchInput, 'xyznonexistent');

      expect(
        screen.getByText(/No menu items found matching your search/i)
      ).toBeInTheDocument();
    });
  });

  describe('adding items', () => {
    it('calls onAddItem when an item Add button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<MenuPanel onAddItem={mockOnAddItem} />, {
        useMemoryRouter: true,
        preloadedState: defaultCartState as any,
      });

      // Find and click the first "Add" button
      const addButtons = screen.getAllByText('+ Add');
      await user.click(addButtons[0]);

      expect(mockOnAddItem).toHaveBeenCalledTimes(1);
    });
  });
});
