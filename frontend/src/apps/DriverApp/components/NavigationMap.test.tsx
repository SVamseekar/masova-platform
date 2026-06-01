import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationMap from './NavigationMap';

const mockGetOptimizedRoute = vi.fn(() => ({
  unwrap: () =>
    Promise.resolve({
      distance: 5200,
      duration: 1080,
      segments: [
        { instruction: 'Head north on Main Road', distance: 1200, duration: 180 },
        { instruction: 'Turn right onto Ring Road', distance: 2500, duration: 360 },
        { instruction: 'Turn left onto Curry Lane', distance: 1500, duration: 240 },
      ],
      estimatedArrival: '2026-02-15T10:45:00Z',
      polyline: '',
      steps: [],
    }),
}));

vi.mock('../../../store/api/deliveryApi', () => ({
  useGetOptimizedRouteMutation: () => [mockGetOptimizedRoute, { isLoading: false }],
  deliveryApi: { reducerPath: 'deliveryApi', reducer: () => ({}), middleware: () => (next: any) => (action: any) => next(action) },
}));

describe('NavigationMap', () => {
  const defaultProps = {
    destination: '42 Curry Lane, Hyderabad',
    destinationCoords: { latitude: 17.4065, longitude: 78.4772 },
    currentLocation: { latitude: 17.385, longitude: 78.4867 },
    orderId: 'order-5',
    autoRefresh: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText('Navigation to Delivery Location')).toBeInTheDocument();
  });

  it('displays the destination address', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText(/42 Curry Lane, Hyderabad/)).toBeInTheDocument();
  });

  it('shows map placeholder', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText(/Click "Open in Google Maps" for navigation/)).toBeInTheDocument();
  });

  it('displays current location coordinates', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText(/17\.3850/)).toBeInTheDocument();
    expect(screen.getByText(/78\.4867/)).toBeInTheDocument();
  });

  it('displays destination coordinates', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText(/17\.4065/)).toBeInTheDocument();
    expect(screen.getByText(/78\.4772/)).toBeInTheDocument();
  });

  it('renders "Open in Google Maps" button', () => {
    render(<NavigationMap {...defaultProps} />);
    const gmapsButton = screen.getByText(/Open in Google Maps/);
    expect(gmapsButton).toBeInTheDocument();
  });

  it('renders "Show Directions" button', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(screen.getByText(/Show.*Directions/)).toBeInTheDocument();
  });

  it('opens Google Maps with correct coordinates on click', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<NavigationMap {...defaultProps} />);
    await user.click(screen.getByText(/Open in Google Maps/));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps/dir'),
      '_blank'
    );
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('17.385'),
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('toggles turn-by-turn directions when Show Directions is clicked', async () => {
    const user = userEvent.setup();

    render(<NavigationMap {...defaultProps} />);

    // Directions should not be visible initially
    expect(screen.queryByText('Turn-by-Turn Directions')).not.toBeInTheDocument();

    // Click to show directions
    await user.click(screen.getByText(/Show.*Directions/));
    expect(screen.getByText('Turn-by-Turn Directions')).toBeInTheDocument();
  });

  it('calls getOptimizedRoute on mount when locations are provided', () => {
    render(<NavigationMap {...defaultProps} />);
    expect(mockGetOptimizedRoute).toHaveBeenCalled();
  });

  it('renders fallback instructions when no current location is provided', () => {
    render(
      <NavigationMap
        destination="42 Curry Lane"
        autoRefresh={false}
      />
    );
    expect(screen.getByText('Navigation to Delivery Location')).toBeInTheDocument();
  });

  it('renders without destination coordinates using address-only fallback', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <NavigationMap
        destination="42 Curry Lane, Hyderabad"
        autoRefresh={false}
      />
    );

    await user.click(screen.getByText(/Open in Google Maps/));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('42+Curry+Lane'),
      '_blank'
    );

    openSpy.mockRestore();
  });
});
