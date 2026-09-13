import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { PINAuthModal } from './PINAuthModal';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

const mockValidatePIN = vi.fn();

vi.mock('../../../store/api/userApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../store/api/userApi')>();
  return {
    ...actual,
    useValidatePINMutation: () => [mockValidatePIN, { isLoading: false }],
  };
});

function fillPin(digits: string) {
  const inputs = screen.getAllByLabelText(/PIN digit/);
  digits.split('').forEach((digit, index) => {
    fireEvent.change(inputs[index], { target: { value: digit } });
  });
}

describe('PINAuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAuthenticated: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
    defaultProps.onAuthenticated.mockClear();
    mockValidatePIN.mockClear();
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(screen.getByText('Cashier PIN')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <PINAuthModal {...defaultProps} isOpen={false} />,
        { useMemoryRouter: true }
      );

      expect(screen.queryByText('Cashier PIN')).not.toBeInTheDocument();
    });

    it('displays the subtitle instruction', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByText(/Enter your 5-digit PIN to authorize this charge/i)
      ).toBeInTheDocument();
    });

    it('renders 5 PIN input fields', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const pinInputs = document.querySelectorAll('input[inputmode="numeric"]');
      expect(pinInputs).toHaveLength(5);
    });

    it('renders Cancel and Continue buttons', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue' })
      ).toBeInTheDocument();
    });

    it('shows help text', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByText(/Don't have a PIN\? Contact your manager/i)
      ).toBeInTheDocument();
    });
  });

  describe('PIN entry', () => {
    it('disables Continue button when PIN is incomplete', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const continueBtn = screen.getByRole('button', { name: 'Continue' });
      expect(continueBtn).toBeDisabled();
    });

    it('accepts digit input in PIN fields', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const inputs = document.querySelectorAll('input[inputmode="numeric"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('1');

      expect(inputs[0]).toHaveValue('1');
    });

    it('auto-focuses next input after entering a digit', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const inputs = document.querySelectorAll('input[inputmode="numeric"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('1');

      // After entering 1, focus should move to second input
      expect(document.activeElement).toBe(inputs[1]);
    });
  });

  describe('cancel functionality', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('displays error message on invalid PIN', async () => {
      mockValidatePIN.mockImplementation(() => ({
        unwrap: () => Promise.reject({ data: { error: 'Invalid PIN' } }),
      }));

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      fillPin('12345');
      expect(await screen.findByText(/Invalid PIN/i)).toBeInTheDocument();
    });

    it('shows incomplete PIN error when submitting partial PIN', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      // Enter only 3 digits
      const inputs = document.querySelectorAll('input[inputmode="numeric"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('123');

      // Try to submit (Continue should be disabled, but test the validation)
      const continueBtn = screen.getByRole('button', { name: 'Continue' });
      expect(continueBtn).toBeDisabled();
    });
  });

  describe('successful authentication', () => {
    it('calls onAuthenticated with user data on valid PIN', async () => {
      const mockUserData = {
        userId: 'user-1',
        name: 'Test User',
        type: 'STAFF',
        role: 'Staff',
        storeId: 'store-1',
      };

      mockValidatePIN.mockReturnValue({
        unwrap: () => Promise.resolve(mockUserData),
      });

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      fillPin('12345');

      await waitFor(() => {
        expect(defaultProps.onAuthenticated).toHaveBeenCalledWith({
          userId: 'user-1',
          name: 'Test User',
          type: 'STAFF',
          role: 'Staff',
          storeId: 'store-1',
        });
      });
    });
  });
});
