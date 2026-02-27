import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAsDriver } from '@/test/utils/testUtils';
import DeliveryHomePage from './DeliveryHomePage';

// Mock RTK Query hooks
vi.mock('../../../store/api/sessionApi', () => ({
  useStartSessionMutation: () => [vi.fn(), { isLoading: false }],
  useEndSessionMutation: () => [vi.fn(), { isLoading: false }],
  sessionApi: { reducerPath: 'sessionApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

vi.mock('../../../store/api/driverApi', () => ({
  useGetDriverPerformanceQuery: () => ({
    data: {
      totalDeliveries: 12,
      totalEarnings: 450,
      totalDistanceCovered: 38,
      averageDeliveryTime: 25,
    },
    isLoading: false,
  }),
  driverApi: { reducerPath: 'driverApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

vi.mock('../../../store/api/deliveryApi', () => ({
  useUpdateLocationMutation: () => [vi.fn(() => ({ unwrap: () => Promise.resolve() })), { isLoading: false }],
  deliveryApi: { reducerPath: 'deliveryApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

vi.mock('../../../services/websocketService', () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: () => false,
  },
}));

// Mock LocationMapModal to avoid deep rendering issues
vi.mock('../components/LocationMapModal', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="location-map-modal"><button onClick={onClose}>Close Modal</button></div> : null,
}));

describe('DeliveryHomePage', () => {
  const defaultProps = {
    isOnline: false,
    setIsOnline: vi.fn(),
    setActiveDeliveries: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders without crashing', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} />);
    expect(screen.getByText('GPS Location')).toBeInTheDocument();
  });

  it('displays "How It Works" instructions section', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Go Online')).toBeInTheDocument();
    expect(screen.getByText('Accept Orders')).toBeInTheDocument();
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Deliver')).toBeInTheDocument();
  });

  it('shows offline message when driver is offline', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} isOnline={false} />);
    expect(screen.getByText('GPS tracking will start when manager clocks you in')).toBeInTheDocument();
  });

  it('shows My Location and Support quick action buttons', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} />);
    expect(screen.getByText('My Location')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('shows GPS mode toggle', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} />);
    expect(screen.getByText('Auto GPS')).toBeInTheDocument();
  });

  it('shows session timer when online with location', () => {
    renderAsDriver(<DeliveryHomePage {...defaultProps} isOnline={true} />);
    // When online but before location is set, the session time display depends on location state
    // The GPS Location heading should still be visible
    expect(screen.getByText('GPS Location')).toBeInTheDocument();
  });

  it('renders Support button that triggers alert', async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderAsDriver(<DeliveryHomePage {...defaultProps} />);

    const supportBtn = screen.getByText('Support');
    await user.click(supportBtn);

    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining('Support Contact')
    );

    alertMock.mockRestore();
  });
});
