import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import PublicMenuPage from './PublicMenuPage';

// Mock the customer MenuPage since it's tested separately
vi.mock('./customer/MenuPage', () => ({
  default: () => <div data-testid="customer-menu-page">Menu Page Content</div>,
}));

describe('PublicMenuPage (pages root)', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('customer-menu-page')).toBeInTheDocument();
  });

  it('renders the MenuPage component', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByText('Menu Page Content')).toBeInTheDocument();
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<PublicMenuPage />);
    expect(screen.getByTestId('customer-menu-page')).toBeInTheDocument();
  });
});
