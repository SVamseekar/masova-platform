import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Neumorphic Badge', () => {
  describe('rendering', () => {
    it('renders children text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      const { container } = render(<Badge>Status</Badge>);
      expect(container.querySelector('span.neumorphic-badge')).toBeInTheDocument();
    });

    it('applies the neumorphic-badge class', () => {
      render(<Badge data-testid="badge">Label</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('neumorphic-badge');
    });

    it('applies custom className', () => {
      render(<Badge className="custom" data-testid="badge">Label</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('neumorphic-badge', 'custom');
    });

    it('forwards ref to the span element', () => {
      const ref = { current: null } as React.RefObject<HTMLSpanElement>;
      render(<Badge ref={ref}>Ref</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<Badge data-testid="badge" aria-label="status badge">Active</Badge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByLabelText('status badge')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it.each(['primary', 'secondary', 'success', 'warning', 'error'] as const)(
      'renders with variant="%s"',
      (variant) => {
        render(<Badge variant={variant} data-testid="badge">{variant}</Badge>);
        expect(screen.getByTestId('badge')).toBeInTheDocument();
        expect(screen.getByText(variant)).toBeInTheDocument();
      }
    );
  });

  describe('size prop', () => {
    it.each(['sm', 'base'] as const)(
      'renders with size="%s"',
      (size) => {
        render(<Badge size={size} data-testid="badge">Label</Badge>);
        expect(screen.getByTestId('badge')).toBeInTheDocument();
      }
    );
  });

  describe('dot mode', () => {
    it('renders as a dot when dot prop is true', () => {
      render(<Badge dot data-testid="badge">Hidden text</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dot');
    });

    it('does not render children when in dot mode', () => {
      render(<Badge dot data-testid="badge">Should not appear</Badge>);
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('renders children when not in dot mode', () => {
      render(<Badge data-testid="badge">Visible text</Badge>);
      expect(screen.getByText('Visible text')).toBeInTheDocument();
    });

    it('applies circular dot styles for sm size', () => {
      render(<Badge dot size="sm" data-testid="badge" />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveStyle({ borderRadius: '50%', padding: '0' });
    });

    it('applies circular dot styles for base size', () => {
      render(<Badge dot size="base" data-testid="badge" />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveStyle({ borderRadius: '50%', padding: '0' });
    });
  });

  describe('custom styles', () => {
    it('merges custom style prop', () => {
      render(<Badge style={{ marginLeft: '8px' }} data-testid="badge">Styled</Badge>);
      expect(screen.getByTestId('badge')).toHaveStyle({ marginLeft: '8px' });
    });
  });
});
