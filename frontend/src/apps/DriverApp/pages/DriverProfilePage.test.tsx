import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsDriver } from '@/test/utils/testUtils';
import DriverProfilePage from './DriverProfilePage';

const mockStartSession = vi.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockEndSession = vi.fn(() => ({ unwrap: () => Promise.resolve() }));

let mockPerformanceData: any = null;
let mockIsLoading = false;
let mockError: any = null;
let mockCurrentSession: any = null;

vi.mock('../../../store/api/driverApi', () => ({
  useGetDriverPerformanceQuery: () => ({
    data: mockPerformanceData,
    isLoading: mockIsLoading,
    error: mockError,
  }),
  driverApi: { reducerPath: 'driverApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

vi.mock('../../../store/api/sessionApi', () => ({
  useGetCurrentSessionQuery: () => ({
    data: mockCurrentSession,
    refetch: vi.fn(),
  }),
  useStartSessionMutation: () => [mockStartSession, { isLoading: false }],
  useEndSessionMutation: () => [mockEndSession, { isLoading: false }],
  sessionApi: { reducerPath: 'sessionApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DriverProfilePage', () => {
  beforeEach(() => {
    mockPerformanceData = {
      totalDeliveries: 150,
      averageRating: 4.5,
      onTimeDeliveryPercentage: 92,
      totalDistanceCovered: 480,
      averageDeliveryTime: 28,
      todayEarnings: 120,
      weekEarnings: 840,
      monthEarnings: 3200,
    };
    mockIsLoading = false;
    mockError = null;
    mockCurrentSession = null;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
  });

  it('shows loading skeleton when performance data is loading', () => {
    mockIsLoading = true;
    mockPerformanceData = null;
    const { container } = renderAsDriver(<DriverProfilePage />);
    expect(container.querySelector('[class*="MuiContainer"]')).toBeInTheDocument();
  });

  it('shows error alert when performance data fails to load', () => {
    mockError = { status: 500, data: 'Server Error' };
    mockPerformanceData = null;
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Failed to load driver performance data')).toBeInTheDocument();
  });

  it('displays driver name from auth state', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Driver User')).toBeInTheDocument();
  });

  it('displays driver initials in avatar', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('DU')).toBeInTheDocument();
  });

  it('displays performance statistics', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(screen.getByText('On-Time Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Time')).toBeInTheDocument();
  });

  it('displays performance values from API data', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('150')).toBeInTheDocument(); // totalDeliveries
    expect(screen.getAllByText('4.5').length).toBeGreaterThanOrEqual(1); // rating
    expect(screen.getByText('92%')).toBeInTheDocument(); // onTimePercentage
    expect(screen.getByText('28m')).toBeInTheDocument(); // avgDeliveryTime
  });

  it('displays earnings summary section', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Earnings Summary')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
  });

  it('shows clock-in message when no active session', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Current Shift')).toBeInTheDocument();
    expect(
      screen.getByText('You are not currently clocked in. Start your shift to begin tracking.')
    ).toBeInTheDocument();
  });

  it('shows Clock In button when no session is active', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Clock In')).toBeInTheDocument();
  });

  it('shows Clock Out button when session is active', () => {
    mockCurrentSession = {
      isActive: true,
      loginTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    };

    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Clock Out')).toBeInTheDocument();
    expect(screen.getByText('Take Break')).toBeInTheDocument();
  });

  it('displays personal information section', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Member Since')).toBeInTheDocument();
  });

  it('shows Logout button', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays total distance covered', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('Total Distance Covered')).toBeInTheDocument();
    expect(screen.getByText('480 km')).toBeInTheDocument();
  });

  it('displays commission note', () => {
    renderAsDriver(<DriverProfilePage />);
    expect(screen.getByText('* 20% commission per delivery')).toBeInTheDocument();
  });
});
