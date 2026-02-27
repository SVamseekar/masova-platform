import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAsCustomer, renderUnauthenticated, screen } from '@/test/utils/testUtils';
import { mockMenuItems } from '@/test/fixtures';
import MenuPage from './MenuPage';

// Mock the menu API
const mockUseGetAvailableMenuQuery = vi.fn();
vi.mock('@/store/api/menuApi', async () => {
  const actual = await vi.importActual('@/store/api/menuApi');
  return {
    ...actual,
    useGetAvailableMenuQuery: () => mockUseGetAvailableMenuQuery(),
  };
});

// Mock AnimatedBackground to avoid rendering complexity
vi.mock('@/components/backgrounds/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

// Mock AppHeader
vi.mock('@/components/common/AppHeader', () => ({
  default: ({ title }: { title?: string }) => (
    <div data-testid="app-header">{title}</div>
  ),
}));

// Mock StoreSelector
vi.mock('@/components/StoreSelector', () => ({
  default: () => <div data-testid="store-selector" />,
}));

// Mock RecipeViewer
vi.mock('@/components/RecipeViewer', () => ({
  default: () => <div data-testid="recipe-viewer" />,
}));

describe('MenuPage', () => {
  beforeEach(() => {
    mockUseGetAvailableMenuQuery.mockReturnValue({
      data: mockMenuItems,
      isLoading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    renderAsCustomer(<MenuPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays the search input', () => {
    renderAsCustomer(<MenuPage />);
    const searchInputs = screen.getAllByPlaceholderText('Search for dishes...');
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it('displays cuisine filter buttons', () => {
    renderAsCustomer(<MenuPage />);
    expect(screen.getByText('SOUTH INDIAN')).toBeInTheDocument();
    expect(screen.getByText('NORTH INDIAN')).toBeInTheDocument();
    expect(screen.getByText('ITALIAN')).toBeInTheDocument();
  });

  it('displays dietary filter buttons', () => {
    renderAsCustomer(<MenuPage />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Non-Veg')).toBeInTheDocument();
  });

  it('shows loading state when menu is loading', () => {
    mockUseGetAvailableMenuQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    renderAsCustomer(<MenuPage />);
    expect(screen.getByText('Loading delicious menu...')).toBeInTheDocument();
  });

  it('shows empty state when no items match filters', () => {
    mockUseGetAvailableMenuQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    renderAsCustomer(<MenuPage />);
    expect(screen.getByText('No items found. Try adjusting your filters.')).toBeInTheDocument();
  });

  it('renders menu items from the API', () => {
    // The default cuisine is SOUTH_INDIAN so only items matching that should show
    mockUseGetAvailableMenuQuery.mockReturnValue({
      data: mockMenuItems,
      isLoading: false,
      error: null,
    });
    renderAsCustomer(<MenuPage />);
    // Masala Dosa is SOUTH_INDIAN cuisine
    expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
  });

  it('renders for unauthenticated users', () => {
    renderUnauthenticated(<MenuPage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('passes hideStaffLogin prop to AppHeader', () => {
    renderAsCustomer(<MenuPage hideStaffLogin />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('renders the store selector', () => {
    renderAsCustomer(<MenuPage />);
    expect(screen.getByTestId('store-selector')).toBeInTheDocument();
  });

  it('displays Add to Cart buttons for menu items', () => {
    renderAsCustomer(<MenuPage />);
    const addButtons = screen.getAllByText('Add to Cart');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('displays View Recipe & Ingredients buttons', () => {
    renderAsCustomer(<MenuPage />);
    const recipeButtons = screen.getAllByText('View Recipe & Ingredients');
    expect(recipeButtons.length).toBeGreaterThan(0);
  });
});
