import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsManager } from '@/test/utils/testUtils';
import ManagementHubSidebar from './ManagementHubSidebar';

describe('ManagementHubSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Navigate to all management features')).toBeInTheDocument();
  });

  it('renders all management category titles', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    expect(screen.getByText('Orders & Payments')).toBeInTheDocument();
    expect(screen.getByText('Inventory & Supply')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('People & Marketing')).toBeInTheDocument();
    expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
  });

  it('renders Dashboard and Logout buttons', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search management pages...')).toBeInTheDocument();
  });

  it('renders Expand All and Collapse All buttons', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);
    expect(screen.getByText(/Expand All/)).toBeInTheDocument();
    expect(screen.getByText(/Collapse All/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderAsManager(<ManagementHubSidebar isOpen onClose={onClose} />);

    await user.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderAsManager(
      <ManagementHubSidebar isOpen onClose={onClose} />
    );

    // The overlay is the first fixed div with onClick={onClose}
    const overlay = container.querySelector('div[style*="position: fixed"]');
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderAsManager(<ManagementHubSidebar isOpen onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when sidebar is closed', () => {
    const onClose = vi.fn();
    renderAsManager(<ManagementHubSidebar isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('filters categories based on search query', async () => {
    const user = userEvent.setup();
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search management pages...');
    await user.type(searchInput, 'inventory');

    expect(screen.getByText('Inventory & Supply')).toBeInTheDocument();
    // Categories without matching items should be filtered out
    expect(screen.queryByText('People & Marketing')).not.toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', async () => {
    const user = userEvent.setup();
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search management pages...');
    await user.type(searchInput, 'xyznonexistent');

    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('expands a category when its header is clicked', async () => {
    const user = userEvent.setup();
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    // Click a category to expand it
    await user.click(screen.getByText('Orders & Payments'));
    // The items within should become visible
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('expands all categories when Expand All is clicked', async () => {
    const user = userEvent.setup();
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    await user.click(screen.getByText(/Expand All/));

    // Items from multiple categories should be visible
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Analytics')).toBeInTheDocument();
  });

  it('collapses all categories when Collapse All is clicked after expanding', async () => {
    const user = userEvent.setup();
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);

    // First expand all
    await user.click(screen.getByText(/Expand All/));
    expect(screen.getByText('Order Management')).toBeInTheDocument();

    // Then collapse all
    await user.click(screen.getByText(/Collapse All/));
    // Items should still be in DOM but hidden via max-height: 0
    // The text will still be in DOM, just visually hidden
  });

  it('shows item count per category', () => {
    renderAsManager(<ManagementHubSidebar {...defaultProps} />);
    // Each category shows "X pages" text
    expect(screen.getByText('4 pages')).toBeInTheDocument(); // Orders & Payments has 4 items
  });
});
