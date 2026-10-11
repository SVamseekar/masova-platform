import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as constants from '../constants';
import PricingSection from './PricingSection';

describe('Product pricing choices', () => {
  it('shows approved monthly prices and requests an annual quote without inventing a discount', async () => {
    const user = userEvent.setup();
    render(<PricingSection />);
    expect(screen.getByText('€149')).toBeInTheDocument();
    expect(screen.getByText('€349')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Annual', exact: true }));
    expect(screen.getByText('Annual pricing is confirmed during your walkthrough.')).toBeInTheDocument();
    expect(screen.getAllByText('Request a quote')).toHaveLength(2);
    expect(screen.queryByText('€149')).not.toBeInTheDocument();
    expect(screen.queryByText(/17%|2 months free/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annual', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Monthly', exact: true }));
    expect(screen.getByText('€149')).toBeInTheDocument();
    expect(screen.getByText('€349')).toBeInTheDocument();
  });

  it('opens the existing walkthrough request for each plan without claiming a free trial', async () => {
    const open = vi.spyOn(constants, 'openContactForm').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<PricingSection />);
    for (const button of screen.getAllByRole('button', { name: 'Book a walkthrough' })) {
      await user.click(button);
    }
    expect(open).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    open.mockRestore();
  });
});
