import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import ClockInModal from './ClockInModal';

const mockValidatePIN = vi.fn();
const mockClockInWithPin = vi.fn();

vi.mock('../../../store/api/userApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../store/api/userApi')>();
  return {
    ...actual,
    useValidatePINMutation: () => [mockValidatePIN, { isLoading: false }],
  };
});

vi.mock('../../../store/api/sessionApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../store/api/sessionApi')>();
  return {
    ...actual,
    useClockInWithPinMutation: () => [mockClockInWithPin, { isLoading: false }],
  };
});

function fillPin(label: RegExp, digits: string) {
  const inputs = screen.getAllByLabelText(label);
  digits.split('').forEach((digit, index) => {
    fireEvent.change(inputs[index], { target: { value: digit } });
  });
}

describe('ClockInModal double-submit guard', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    storeId: 'DOM001',
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
    mockValidatePIN.mockClear();
    mockClockInWithPin.mockClear();
  });

  it('does not call validatePIN twice when Enter is pressed repeatedly on the employee step', async () => {
    let resolveValidate: (v: unknown) => void = () => {};
    mockValidatePIN.mockImplementation(() => ({
      unwrap: () =>
        new Promise((resolve) => {
          resolveValidate = resolve;
        }),
    }));

    renderWithProviders(<ClockInModal {...defaultProps} />, {
      useMemoryRouter: true,
    });

    fillPin(/Employee PIN digit/, '12345');
    const inputs = screen.getAllByLabelText(/Employee PIN digit/);
    fireEvent.keyDown(inputs[4], { key: 'Enter' });
    fireEvent.keyDown(inputs[4], { key: 'Enter' });

    await waitFor(() => expect(mockValidatePIN).toHaveBeenCalled());
    resolveValidate({
      userId: 'staff-1',
      name: 'Staff One',
      type: 'STAFF',
      role: 'Staff',
      storeId: 'DOM001',
    });

    await waitFor(() => expect(screen.getByText(/Manager: Enter your PIN/i)).toBeInTheDocument());
    expect(mockValidatePIN).toHaveBeenCalledTimes(1);
  });
});
