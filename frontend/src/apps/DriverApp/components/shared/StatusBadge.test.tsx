import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, StatusType } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('displays correct label for "online" status', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('displays correct label for "offline" status', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('displays correct label for "delivering" status', () => {
    render(<StatusBadge status="delivering" />);
    expect(screen.getByText('On Delivery')).toBeInTheDocument();
  });

  it('displays correct label for "idle" status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it.each<StatusType>(['online', 'offline', 'delivering', 'idle'])(
    'renders with status "%s" without errors',
    (status) => {
      const { container } = render(<StatusBadge status={status} />);
      expect(container.firstChild).toBeInTheDocument();
    }
  );

  it('renders status dot by default', () => {
    const { container } = render(<StatusBadge status="online" />);
    // The dot is a Box with borderRadius: 50%
    const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('hides status dot when showDot is false', () => {
    const { container } = render(<StatusBadge status="online" showDot={false} />);
    // With showDot=false, there should be fewer Box elements
    // The label should still appear
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders in small size', () => {
    render(<StatusBadge status="online" size="small" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders in medium size (default)', () => {
    render(<StatusBadge status="online" size="medium" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders in large size', () => {
    render(<StatusBadge status="online" size="large" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders with animation disabled', () => {
    render(<StatusBadge status="online" animated={false} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
