import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';

describe('Base Card Components', () => {
  describe('Card (re-exported neumorphic Card)', () => {
    it('renders children content', () => {
      render(<Card>Card body</Card>);
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('applies the neumorphic-card class', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('neumorphic-card');
    });
  });

  describe('CardHeader', () => {
    it('renders children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('applies border-bottom styling', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header.style.borderBottom).toBeTruthy();
    });

    it('merges custom style prop', () => {
      render(<CardHeader data-testid="header" style={{ backgroundColor: 'red' }}>Header</CardHeader>);
      expect(screen.getByTestId('header')).toHaveStyle({ backgroundColor: 'red' });
    });

    it('spreads additional HTML attributes', () => {
      render(<CardHeader data-testid="header" aria-label="card header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByLabelText('card header')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders children text', () => {
      render(<CardTitle>My Title</CardTitle>);
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('renders as an h3 heading element', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('applies bold font weight', () => {
      render(<CardTitle data-testid="title">Bold Title</CardTitle>);
      expect(screen.getByTestId('title').style.fontWeight).toBeTruthy();
    });

    it('sets margin to 0', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveStyle({ margin: '0' });
    });

    it('merges custom style prop', () => {
      render(<CardTitle style={{ color: 'blue' }}>Styled Title</CardTitle>);
      expect(screen.getByRole('heading')).toHaveStyle({ color: 'blue' });
    });

    it('spreads additional HTML attributes', () => {
      render(<CardTitle data-testid="title" id="main-title">Title</CardTitle>);
      expect(screen.getByTestId('title')).toHaveAttribute('id', 'main-title');
    });
  });

  describe('CardDescription', () => {
    it('renders children text', () => {
      render(<CardDescription>A short description</CardDescription>);
      expect(screen.getByText('A short description')).toBeInTheDocument();
    });

    it('renders as a paragraph element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('merges custom style prop', () => {
      render(
        <CardDescription data-testid="desc" style={{ fontStyle: 'italic' }}>
          Italic description
        </CardDescription>
      );
      expect(screen.getByTestId('desc')).toHaveStyle({ fontStyle: 'italic' });
    });

    it('spreads additional HTML attributes', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId('desc')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('renders children content', () => {
      render(<CardContent>Body content here</CardContent>);
      expect(screen.getByText('Body content here')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('applies padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content').style.padding).toBeTruthy();
    });

    it('merges custom style prop', () => {
      render(
        <CardContent data-testid="content" style={{ backgroundColor: '#f0f0f0' }}>
          Content
        </CardContent>
      );
      expect(screen.getByTestId('content')).toHaveStyle({ backgroundColor: '#f0f0f0' });
    });

    it('spreads additional HTML attributes', () => {
      render(<CardContent data-testid="content" role="region">Content</CardContent>);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('composed Card', () => {
    it('renders a full card with all sub-components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your items before checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <p>2 items in cart</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
      expect(screen.getByText('Review your items before checkout')).toBeInTheDocument();
      expect(screen.getByText('2 items in cart')).toBeInTheDocument();
    });
  });
});
