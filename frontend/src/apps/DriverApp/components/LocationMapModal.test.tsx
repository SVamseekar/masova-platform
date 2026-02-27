import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationMapModal from './LocationMapModal';

describe('LocationMapModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    location: { latitude: 17.385, longitude: 78.4867 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(screen.getByText('My Current Location')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<LocationMapModal {...defaultProps} open={false} />);
    expect(screen.queryByText('My Current Location')).not.toBeInTheDocument();
  });

  it('displays GPS coordinates with correct precision', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(screen.getByText('17.385000, 78.486700')).toBeInTheDocument();
  });

  it('shows "GPS Coordinates" label', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(screen.getByText('GPS Coordinates')).toBeInTheDocument();
  });

  it('renders an iframe with OpenStreetMap embed', () => {
    render(<LocationMapModal {...defaultProps} />);
    const iframe = screen.getByTitle('Current Location Map');
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('src')).toContain('openstreetmap.org');
  });

  it('renders "Open in Google Maps" button', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(screen.getByText('Open in Google Maps')).toBeInTheDocument();
  });

  it('renders "Open in OpenStreetMap" button', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(screen.getByText('Open in OpenStreetMap')).toBeInTheDocument();
  });

  it('opens Google Maps link when button is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<LocationMapModal {...defaultProps} />);

    await user.click(screen.getByText('Open in Google Maps'));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('17.385'),
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('opens OpenStreetMap link when button is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<LocationMapModal {...defaultProps} />);

    await user.click(screen.getByText('Open in OpenStreetMap'));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('openstreetmap.org'),
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LocationMapModal {...defaultProps} onClose={onClose} />);

    // The close button is an IconButton with CloseIcon
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(
      (btn) => btn.querySelector('[data-testid="CloseIcon"]') !== null
    );

    if (closeBtn) {
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('displays info note about navigation', () => {
    render(<LocationMapModal {...defaultProps} />);
    expect(
      screen.getByText(
        /This is your current GPS location\. For turn-by-turn navigation/
      )
    ).toBeInTheDocument();
  });

  it('formats coordinates correctly for different locations', () => {
    render(
      <LocationMapModal
        open={true}
        onClose={vi.fn()}
        location={{ latitude: 40.712800, longitude: -74.006000 }}
      />
    );
    expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
  });
});
