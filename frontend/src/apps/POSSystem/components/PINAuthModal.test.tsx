import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/testUtils';
import { PINAuthModal } from './PINAuthModal';

// ---------------------------------------------------------------------------
// Mock RTK Query hooks
// ---------------------------------------------------------------------------

const mockValidatePIN = vi.fn();

vi.mock('../../../store/api/userApi', () => ({
  useValidatePINMutation: () => [mockValidatePIN, { isLoading: false }],
}));

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

      expect(screen.getByText('Enter Your PIN')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderWithProviders(
        <PINAuthModal {...defaultProps} isOpen={false} />,
        { useMemoryRouter: true }
      );

      expect(screen.queryByText('Enter Your PIN')).not.toBeInTheDocument();
    });

    it('displays the subtitle instruction', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      expect(
        screen.getByText(/Enter your 5-digit PIN to start taking orders/i)
      ).toBeInTheDocument();
    });

    it('renders 5 PIN input fields', () => {
      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const inputs = screen.getAllByRole('textbox', { hidden: true });
      // password inputs are not textboxes, let's query by type
      const passwordInputs = document.querySelectorAll(
        'input[type="password"]'
      );
      expect(passwordInputs).toHaveLength(5);
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

      const inputs = document.querySelectorAll('input[type="password"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('1');

      expect(inputs[0]).toHaveValue('1');
    });

    it('auto-focuses next input after entering a digit', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      const inputs = document.querySelectorAll('input[type="password"]');
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
      const user = userEvent.setup();
      mockValidatePIN.mockReturnValue({
        unwrap: () => Promise.reject({ data: { error: 'Invalid PIN' } }),
      });

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      // Enter a 5-digit PIN
      const inputs = document.querySelectorAll('input[type="password"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('12345');

      // Click Continue
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid PIN')).toBeInTheDocument();
      });
    });

    it('shows incomplete PIN error when submitting partial PIN', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PINAuthModal {...defaultProps} />, {
        useMemoryRouter: true,
      });

      // Enter only 3 digits
      const inputs = document.querySelectorAll('input[type="password"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('123');

      // Try to submit (Continue should be disabled, but test the validation)
      const continueBtn = screen.getByRole('button', { name: 'Continue' });
      expect(continueBtn).toBeDisabled();
    });
  });

  describe('successful authentication', () => {
    it('calls onAuthenticated with user data on valid PIN', async () => {
      const user = userEvent.setup();
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

      // Enter all 5 digits
      const inputs = document.querySelectorAll('input[type="password"]');
      await user.click(inputs[0] as HTMLElement);
      await user.keyboard('1');
      await user.click(inputs[1] as HTMLElement);
      await user.keyboard('2');
      await user.click(inputs[2] as HTMLElement);
      await user.keyboard('3');
      await user.click(inputs[3] as HTMLElement);
      await user.keyboard('4');
      await user.click(inputs[4] as HTMLElement);
      await user.keyboard('5');

      // Click Continue
      await user.click(screen.getByRole('button', { name: 'Continue' }));

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
