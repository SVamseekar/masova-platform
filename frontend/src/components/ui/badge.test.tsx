import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Base Badge (re-export)', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders as a span with neumorphic-badge class', () => {
    render(<Badge data-testid="badge">Status</Badge>);
    expect(screen.getByTestId('badge').tagName).toBe('SPAN');
    expect(screen.getByTestId('badge')).toHaveClass('neumorphic-badge');
  });

  it('accepts variant prop passed through to neumorphic Badge', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('accepts size prop passed through to neumorphic Badge', () => {
    render(<Badge size="sm" data-testid="badge">Small</Badge>);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('accepts dot prop passed through to neumorphic Badge', () => {
    render(<Badge dot data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('dot');
  });
});
