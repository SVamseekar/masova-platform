import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, renderAsCustomer, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';

vi.mock('../components/common/AppHeader', () => ({
  default: () => <div data-testid="app-header" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('HomePage (pages root)', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('displays the main title', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('MaSoVa Restaurant System')).toBeInTheDocument();
  });

  it('displays the subtitle', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Multi-Cuisine Restaurant Management Platform')).toBeInTheDocument();
  });

  it('displays the version badge', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/Phase 1, 2, 3 Complete/)).toBeInTheDocument();
  });

  it('renders stats section with correct numbers', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('65+')).toBeInTheDocument();
    expect(screen.getByText('Menu Items')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Cuisines')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Phases Complete')).toBeInTheDocument();
  });

  it('renders all four feature cards', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
    expect(screen.getByText('Loyalty Rewards')).toBeInTheDocument();
    expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/65\+ delicious items across 8 cuisines/)).toBeInTheDocument();
    expect(screen.getByText(/Earn 1 point per/)).toBeInTheDocument();
    expect(screen.getByText(/Complete store management/)).toBeInTheDocument();
    expect(screen.getByText(/Real-time order queue/)).toBeInTheDocument();
  });

  it('renders feature action buttons', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Explore Menu')).toBeInTheDocument();
    expect(screen.getByText('Join Now')).toBeInTheDocument();
    expect(screen.getByText('Manager Login')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Login')).toBeInTheDocument();
  });

  it('navigates to /menu when "Explore Menu" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Explore Menu'));
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  it('navigates to /customer-login when "Join Now" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Join Now'));
    expect(mockNavigate).toHaveBeenCalledWith('/customer-login');
  });

  it('navigates to /login when "Manager Login" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Manager Login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to /login when "Kitchen Login" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<HomePage />);
    await user.click(screen.getByText('Kitchen Login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the Loyalty Rewards Program section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/MaSoVa Loyalty Rewards Program/)).toBeInTheDocument();
    expect(screen.getByText('How to Earn Points')).toBeInTheDocument();
    expect(screen.getByText('How to Redeem')).toBeInTheDocument();
  });

  it('displays loyalty tier information', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('BRONZE')).toBeInTheDocument();
    expect(screen.getByText('SILVER')).toBeInTheDocument();
    expect(screen.getByText('GOLD')).toBeInTheDocument();
    expect(screen.getByText('PLATINUM')).toBeInTheDocument();
  });

  it('displays tier multipliers', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('1x Points')).toBeInTheDocument();
    expect(screen.getByText('1.25x Points')).toBeInTheDocument();
    expect(screen.getByText('1.5x Points')).toBeInTheDocument();
    expect(screen.getByText('2x Points')).toBeInTheDocument();
  });

  it('renders completed development phases section', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('Completed Development Phases')).toBeInTheDocument();
    expect(screen.getByText('Phase 1: User Management')).toBeInTheDocument();
    expect(screen.getByText('Phase 2: Session Tracking')).toBeInTheDocument();
    expect(screen.getByText('Phase 3: Menu Service')).toBeInTheDocument();
  });

  it('renders the tech stack footer', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText(/Built with Java 21/)).toBeInTheDocument();
    expect(screen.getByText(/Microservices Architecture/)).toBeInTheDocument();
  });

  it('is accessible without authentication', () => {
    renderUnauthenticated(<HomePage />);
    expect(screen.getByText('MaSoVa Restaurant System')).toBeInTheDocument();
  });
});
