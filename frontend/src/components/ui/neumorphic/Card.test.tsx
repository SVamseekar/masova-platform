import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Neumorphic Card', () => {
  describe('rendering', () => {
    it('renders children content', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as a div by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('div.neumorphic-card')).toBeInTheDocument();
    });

    it('applies the neumorphic-card class', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('neumorphic-card');
    });

    it('applies custom className alongside default class', () => {
      render(<Card className="my-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('neumorphic-card', 'my-card');
    });

    it('forwards ref to the element', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>;
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<Card data-testid="card" aria-label="card section">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByLabelText('card section')).toBeInTheDocument();
    });
  });

  describe('as prop (polymorphic rendering)', () => {
    it('renders as an article element', () => {
      const { container } = render(<Card as="article">Article card</Card>);
      expect(container.querySelector('article')).toBeInTheDocument();
    });

    it('renders as a section element', () => {
      const { container } = render(<Card as="section">Section card</Card>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('elevation prop', () => {
    it.each(['sm', 'base', 'md', 'lg'] as const)(
      'renders with elevation="%s"',
      (elevation) => {
        render(<Card elevation={elevation} data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toBeInTheDocument();
      }
    );
  });

  describe('padding prop', () => {
    it.each(['sm', 'base', 'lg', 'xl'] as const)(
      'renders with padding="%s"',
      (padding) => {
        render(<Card padding={padding} data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toBeInTheDocument();
      }
    );
  });

  describe('interactive prop', () => {
    it('does not add interactive class by default', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).not.toHaveClass('interactive');
    });

    it('adds interactive class when prop is true', () => {
      render(<Card interactive data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('interactive');
    });
  });

  describe('styles', () => {
    it('applies position relative', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveStyle({ position: 'relative' });
    });

    it('merges custom style prop', () => {
      render(<Card data-testid="card" style={{ border: '1px solid red' }}>Content</Card>);
      expect(screen.getByTestId('card')).toHaveStyle({ border: '1px solid red' });
    });
  });
});
