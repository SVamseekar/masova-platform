import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Neumorphic Checkbox', () => {
  describe('rendering', () => {
    it('renders a checkbox input', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders with a label when label prop is provided', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('does not render a label when label prop is omitted', () => {
      const { container } = render(<Checkbox />);
      expect(container.querySelector('span')).not.toBeInTheDocument();
    });

    it('forwards ref to the input element', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Checkbox ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('checkbox');
    });

    it('spreads additional HTML attributes', () => {
      render(<Checkbox data-testid="my-checkbox" name="agree" />);
      expect(screen.getByTestId('my-checkbox')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'agree');
    });

    it('wraps everything in a label element for click-anywhere behavior', () => {
      const { container } = render(<Checkbox label="Click anywhere" />);
      expect(container.querySelector('label')).toBeInTheDocument();
    });
  });

  describe('checked state', () => {
    it('renders unchecked by default', () => {
      render(<Checkbox onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('renders checked when checked prop is true', () => {
      render(<Checkbox checked onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('renders unchecked when checked prop is false', () => {
      render(<Checkbox checked={false} onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('disabled state', () => {
    it('disables the checkbox when disabled prop is true', () => {
      render(<Checkbox disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('is not disabled by default', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).not.toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onChange={handleChange} label="Disabled" />);

      await user.click(screen.getByText('Disabled'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('size prop', () => {
    it.each(['sm', 'base', 'lg'] as const)(
      'renders with size="%s"',
      (size) => {
        render(<Checkbox size={size} />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
      }
    );
  });

  describe('interaction', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} label="Toggle" />);

      await user.click(screen.getByText('Toggle'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('can be toggled via keyboard (space key)', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);

      screen.getByRole('checkbox').focus();
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('styles', () => {
    it('applies custom className', () => {
      const { container } = render(<Checkbox className="custom-check" />);
      expect(container.querySelector('.custom-check')).toBeInTheDocument();
    });

    it('merges custom style prop', () => {
      const { container } = render(<Checkbox style={{ marginTop: '16px' }} />);
      const label = container.querySelector('label');
      expect(label).toHaveStyle({ marginTop: '16px' });
    });
  });
});
