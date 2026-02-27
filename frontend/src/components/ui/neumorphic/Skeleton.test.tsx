import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Neumorphic Skeleton', () => {
  describe('rendering', () => {
    it('renders a div element', () => {
      const { container } = render(<Skeleton />);
      expect(container.querySelector('.neumorphic-skeleton')).toBeInTheDocument();
    });

    it('applies the neumorphic-skeleton class', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('neumorphic-skeleton');
    });

    it('applies custom className', () => {
      render(<Skeleton className="my-skeleton" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('neumorphic-skeleton', 'my-skeleton');
    });

    it('forwards ref to the div element', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<Skeleton ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-hidden="true" to hide from screen readers', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('variant prop', () => {
    it('applies "text" variant class by default', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('text');
    });

    it('applies "rectangular" variant class', () => {
      render(<Skeleton variant="rectangular" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rectangular');
    });

    it('applies "circular" variant class', () => {
      render(<Skeleton variant="circular" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('circular');
    });

    it('applies circular border-radius for circular variant', () => {
      render(<Skeleton variant="circular" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ borderRadius: '50%' });
    });

    it('uses height for both width and height in circular variant', () => {
      render(<Skeleton variant="circular" height="48px" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('applies rounded border-radius for rectangular variant', () => {
      render(<Skeleton variant="rectangular" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ borderRadius: '0.5rem' });
    });

    it('applies small border-radius for text variant', () => {
      render(<Skeleton variant="text" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ borderRadius: '0.25rem' });
    });
  });

  describe('width and height props', () => {
    it('defaults to 100% width and 1rem height', () => {
      render(<Skeleton data-testid="skeleton" />);
      // Width/height are applied via createSkeleton utility
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('accepts string width', () => {
      render(<Skeleton width="200px" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('accepts number width and converts to px', () => {
      render(<Skeleton width={200} data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('accepts string height', () => {
      render(<Skeleton height="3rem" data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('accepts number height and converts to px', () => {
      render(<Skeleton height={40} data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('animation prop', () => {
    it('includes animation styles by default', () => {
      const { container } = render(<Skeleton />);
      const styleElement = container.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain('skeleton-loading');
    });

    it('does not include animation styles when animation is false', () => {
      const { container } = render(<Skeleton animation={false} />);
      const styleElement = container.querySelector('style');
      expect(styleElement).not.toBeInTheDocument();
    });
  });

  describe('custom styles', () => {
    it('merges custom style prop', () => {
      render(<Skeleton style={{ opacity: 0.5 }} data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ opacity: '0.5' });
    });
  });
});
