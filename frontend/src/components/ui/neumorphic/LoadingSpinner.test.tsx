import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('Neumorphic LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders a spinner element', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('applies the neumorphic-spinner class', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveClass('neumorphic-spinner');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="my-spinner" />);
      expect(screen.getByRole('status')).toHaveClass('neumorphic-spinner', 'my-spinner');
    });

    it('forwards ref to the div element', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<LoadingSpinner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<LoadingSpinner data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label="Loading" by default', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('allows custom aria-label', () => {
      render(<LoadingSpinner aria-label="Fetching data" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Fetching data');
    });
  });

  describe('size prop', () => {
    it('renders with default base size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({ width: '1.5rem', height: '1.5rem' });
    });

    it('renders sm size', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({ width: '1rem', height: '1rem' });
    });

    it('renders lg size', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({ width: '2rem', height: '2rem' });
    });

    it('renders xl size', () => {
      render(<LoadingSpinner size="xl" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({ width: '3rem', height: '3rem' });
    });
  });

  describe('variant prop', () => {
    it.each(['primary', 'secondary', 'neutral'] as const)(
      'renders with variant="%s"',
      (variant) => {
        render(<LoadingSpinner variant={variant} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      }
    );
  });

  describe('speed prop', () => {
    it('applies slow animation speed', () => {
      render(<LoadingSpinner speed="slow" />);
      expect(screen.getByRole('status')).toHaveStyle({ animation: 'spin 2s linear infinite' });
    });

    it('applies normal animation speed by default', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveStyle({ animation: 'spin 1s linear infinite' });
    });

    it('applies fast animation speed', () => {
      render(<LoadingSpinner speed="fast" />);
      expect(screen.getByRole('status')).toHaveStyle({ animation: 'spin 0.5s linear infinite' });
    });
  });

  describe('styles', () => {
    it('renders with circular border-radius', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveStyle({ borderRadius: '50%' });
    });

    it('displays as inline-block', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toHaveStyle({ display: 'inline-block' });
    });

    it('merges custom style prop', () => {
      render(<LoadingSpinner style={{ margin: '10px' }} />);
      expect(screen.getByRole('status')).toHaveStyle({ margin: '10px' });
    });
  });
});
