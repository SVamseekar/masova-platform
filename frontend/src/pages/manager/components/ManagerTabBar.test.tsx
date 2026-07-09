import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagerTabBar } from './ManagerTabBar';

const TABS = [
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
] as const;

describe('ManagerTabBar', () => {
  it('renders tabs with active state', () => {
    render(
      <ManagerTabBar tabs={TABS} activeTab="orders" onChange={() => undefined} />,
    );
    expect(screen.getByTestId('manager-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('manager-tab-orders')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('manager-tab-payments')).toHaveAttribute('data-active', 'false');
    expect(screen.getByRole('tab', { name: 'Orders' })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ManagerTabBar tabs={TABS} activeTab="orders" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Payments' }));
    expect(onChange).toHaveBeenCalledWith('payments');
  });
});
