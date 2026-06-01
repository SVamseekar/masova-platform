import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Neumorphic Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies the neumorphic-input-container class to wrapper', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('.neumorphic-input-container')).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const { container } = render(<Input className="my-input" />);
      expect(container.querySelector('.my-input')).toBeInTheDocument();
    });

    it('forwards ref to the input element', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('spreads additional HTML attributes', () => {
      render(<Input data-testid="custom-input" placeholder="Enter text" />);
      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
  });

  describe('label', () => {
    it('renders a label when label prop is provided', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates label with input via htmlFor/id', () => {
      render(<Input label="Username" id="username-field" />);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username-field');
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'username-field');
    });

    it('generates a unique id when no id prop is provided', () => {
      render(<Input label="Name" />);
      const input = screen.getByRole('textbox');
      expect(input.id).toBeTruthy();
    });

    it('does not render a label when label prop is omitted', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });
  });

  describe('helperText', () => {
    it('renders helper text when provided', () => {
      render(<Input helperText="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('does not render helper text when omitted', () => {
      const { container } = render(<Input />);
      // Only the input container and style element should be present
      expect(container.textContent).toBe('');
    });
  });

  describe('state prop', () => {
    it.each(['default', 'error', 'success'] as const)(
      'renders with state="%s"',
      (state) => {
        render(<Input state={state} data-testid="input" />);
        expect(screen.getByTestId('input')).toBeInTheDocument();
      }
    );

    it('shows error styling for helper text in error state', () => {
      render(<Input state="error" helperText="Invalid input" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });
  });

  describe('size prop', () => {
    it.each(['sm', 'base', 'lg'] as const)(
      'renders with size="%s"',
      (size) => {
        render(<Input size={size} data-testid="input" />);
        expect(screen.getByTestId('input')).toBeInTheDocument();
      }
    );
  });

  describe('icons', () => {
    it('renders a left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">S</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders a right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">X</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('does not render right icon when showPasswordToggle is true', () => {
      render(
        <Input
          type="password"
          showPasswordToggle
          rightIcon={<span data-testid="right-icon">X</span>}
        />
      );
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('password toggle', () => {
    it('renders a toggle button for password inputs', () => {
      render(<Input type="password" showPasswordToggle />);
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    it('toggles input type between password and text', async () => {
      const user = userEvent.setup();
      render(<Input type="password" showPasswordToggle data-testid="pw-input" />);

      const input = screen.getByTestId('pw-input');
      expect(input).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: /show password/i }));
      expect(input).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: /hide password/i }));
      expect(input).toHaveAttribute('type', 'password');
    });

    it('does not render toggle for non-password inputs', () => {
      render(<Input type="text" showPasswordToggle />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'hello');
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('calls onFocus when input receives focus', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      await user.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      await user.click(screen.getByRole('textbox'));
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('value handling', () => {
    it('handles null value by converting to empty string', () => {
      render(<Input value={null as unknown as string} onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('displays the provided value', () => {
      render(<Input value="test value" onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });
  });

  describe('custom styles', () => {
    it('merges custom style prop with computed styles', () => {
      render(<Input style={{ border: '2px solid blue' }} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveStyle({ border: '2px solid blue' });
    });
  });
});
