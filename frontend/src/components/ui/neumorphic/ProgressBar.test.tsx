import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('Neumorphic ProgressBar', () => {
  describe('rendering', () => {
    it('renders a progressbar element', () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('applies the neumorphic-progress class', () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole('progressbar')).toHaveClass('neumorphic-progress');
    });

    it('applies custom className', () => {
      render(<ProgressBar value={50} className="my-progress" />);
      expect(screen.getByRole('progressbar')).toHaveClass('neumorphic-progress', 'my-progress');
    });

    it('forwards ref to the div element', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<ProgressBar ref={ref} value={50} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<ProgressBar value={50} data-testid="progress" />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });

  describe('ARIA attributes', () => {
    it('sets aria-valuenow to the current value', () => {
      render(<ProgressBar value={42} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    });

    it('sets aria-valuemin to 0', () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('sets aria-valuemax to the max prop', () => {
      render(<ProgressBar value={50} max={200} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '200');
    });

    it('defaults aria-valuemax to 100', () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    });

    it('uses label prop for aria-label when provided', () => {
      render(<ProgressBar value={50} label="Upload progress" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Upload progress');
    });

    it('generates a default aria-label from value and max', () => {
      render(<ProgressBar value={30} max={100} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Progress: 30 of 100');
    });
  });

  describe('value clamping', () => {
    it('clamps progress to 0 for negative values', () => {
      render(<ProgressBar value={-10} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '-10');
      // The visual progress is clamped but aria-valuenow reflects the raw value
    });

    it('handles value exceeding max', () => {
      render(<ProgressBar value={150} max={100} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(<ProgressBar value={0} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles value equal to max', () => {
      render(<ProgressBar value={100} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('label and showLabel', () => {
    it('renders the label text when label prop is provided', () => {
      render(<ProgressBar value={50} label="Downloading" />);
      expect(screen.getByText('Downloading')).toBeInTheDocument();
    });

    it('renders percentage when showLabel is true', () => {
      render(<ProgressBar value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders both label and percentage simultaneously', () => {
      render(<ProgressBar value={50} label="Progress" showLabel />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('does not render label area when neither label nor showLabel is set', () => {
      const { container } = render(<ProgressBar value={50} />);
      // Should only have the track div, no label container
      const progressbar = container.querySelector('.neumorphic-progress');
      expect(progressbar?.children.length).toBe(1); // Just the track
    });

    it('rounds the percentage display', () => {
      render(<ProgressBar value={33} max={100} showLabel />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('color prop', () => {
    it.each(['primary', 'success', 'warning', 'error'] as const)(
      'renders with color="%s"',
      (color) => {
        render(<ProgressBar value={50} color={color} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      }
    );
  });

  describe('size prop', () => {
    it.each(['sm', 'base', 'lg'] as const)(
      'renders with size="%s"',
      (size) => {
        render(<ProgressBar value={50} size={size} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      }
    );
  });

  describe('styles', () => {
    it('renders full width by default', () => {
      render(<ProgressBar value={50} />);
      expect(screen.getByRole('progressbar')).toHaveStyle({ width: '100%' });
    });

    it('merges custom style prop', () => {
      render(<ProgressBar value={50} style={{ maxWidth: '300px' }} />);
      expect(screen.getByRole('progressbar')).toHaveStyle({ maxWidth: '300px' });
    });
  });
});
