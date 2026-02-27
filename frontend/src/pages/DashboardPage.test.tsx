import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import DashboardPage from './DashboardPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText("Domino's Manager")).toBeInTheDocument();
  });

  it('displays the header with dashboard title', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('Restaurant Management Dashboard')).toBeInTheDocument();
  });

  it('renders navigation tabs', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Staff Sessions')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows overview tab by default', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText("Yesterday's Sales")).toBeInTheDocument();
    expect(screen.getByText('Weekly Total')).toBeInTheDocument();
    expect(screen.getByText('Active Staff')).toBeInTheDocument();
  });

  it('displays sales figures', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText(/45,000/)).toBeInTheDocument();
    expect(screen.getByText(/42,000/)).toBeInTheDocument();
    expect(screen.getByText(/2,80,000/)).toBeInTheDocument();
  });

  it('displays the active staff count', () => {
    renderUnauthenticated(<DashboardPage />);
    // 2 active staff members from the mock data
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the live order queue', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('Live Order Queue')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
  });

  it('shows order statuses in the queue', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('PREPARING')).toBeInTheDocument();
    expect(screen.getByText('OVEN')).toBeInTheDocument();
    expect(screen.getByText('BAKED')).toBeInTheDocument();
    expect(screen.getByText('DISPATCHED')).toBeInTheDocument();
  });

  it('highlights urgent orders', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('renders active staff sessions section', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('Active Staff Sessions')).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });

  it('switches to staff tab', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);

    await user.click(screen.getByText('Staff Sessions'));
    expect(screen.getByText('Staff Working Hours')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('shows all staff sessions in staff tab', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);

    await user.click(screen.getByText('Staff Sessions'));
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Amit Singh')).toBeInTheDocument();
    expect(screen.getByText('Sneha Patel')).toBeInTheDocument();
  });

  it('shows approve/reject buttons for pending sessions', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);

    await user.click(screen.getByText('Staff Sessions'));
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('switches to analytics tab', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);

    await user.click(screen.getByText('Analytics'));
    expect(screen.getByText('Weekly Sales Performance (INR)')).toBeInTheDocument();
    expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
  });

  it('displays KPIs in analytics tab', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);

    await user.click(screen.getByText('Analytics'));
    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('Orders Today')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Efficiency')).toBeInTheDocument();
  });

  it('renders the Logout button', () => {
    renderUnauthenticated(<DashboardPage />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('navigates to /login on logout', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<DashboardPage />);
    await user.click(screen.getByText('Logout'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
