import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Neumorphic Button', () => {
  describe('rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with default variant and size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('neumorphic-button');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Styled</Button>);
      expect(screen.getByRole('button')).toHaveClass('neumorphic-button', 'custom-class');
    });

    it('forwards ref to the button element', () => {
      const ref = { current: null } as React.RefObject<HTMLButtonElement>;
      render(<Button ref={ref}>Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<Button data-testid="custom-btn" aria-label="custom">Test</Button>);
      expect(screen.getByTestId('custom-btn')).toBeInTheDocument();
      expect(screen.getByLabelText('custom')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      'renders with variant="%s"',
      (variant) => {
        render(<Button variant={variant}>{variant}</Button>);
        expect(screen.getByRole('button', { name: variant })).toBeInTheDocument();
      }
    );
  });

  describe('sizes', () => {
    it.each(['sm', 'base', 'lg', 'xl'] as const)(
      'renders with size="%s"',
      (size) => {
        render(<Button size={size}>Size {size}</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      }
    );
  });

  describe('fullWidth', () => {
    it('renders with auto width by default', () => {
      render(<Button>Normal</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ width: 'auto' });
    });

    it('renders full width when prop is set', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ width: '100%' });
    });
  });

  describe('icons', () => {
    it('renders a left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">L</span>}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders a right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">R</span>}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders both left and right icons simultaneously', () => {
      render(
        <Button
          leftIcon={<span data-testid="left">L</span>}
          rightIcon={<span data-testid="right">R</span>}
        >
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('right')).toBeInTheDocument();
    });

    it('does not render icons when loading', () => {
      render(
        <Button isLoading leftIcon={<span data-testid="left-icon">L</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading text when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('renders a spinner element when loading', () => {
      const { container } = render(<Button isLoading>Submit</Button>);
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('disables the button when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('reduces opacity when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('disabled state', () => {
    it('disables the button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('reduces opacity when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.6' });
    });

    it('prevents click events when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('interaction', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Loading</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('custom styles', () => {
    it('merges custom style prop with computed styles', () => {
      render(<Button style={{ marginTop: '10px' }}>Styled</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ marginTop: '10px' });
    });
  });
});
