import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import POSSystem from './POSSystem';

describe('POSSystem (placeholder page)', () => {
  it('renders without crashing', () => {
    renderWithProviders(<POSSystem />, { useMemoryRouter: true });
    expect(screen.getByText('POS System')).toBeInTheDocument();
  });

  it('displays the coming soon message', () => {
    renderWithProviders(<POSSystem />, { useMemoryRouter: true });
    expect(
      screen.getByText('Point of Sale interface coming soon...')
    ).toBeInTheDocument();
  });

  it('renders the POS icon', () => {
    const { container } = renderWithProviders(<POSSystem />, {
      useMemoryRouter: true,
    });
    // MUI PointOfSale icon renders as an SVG inside a data-testid
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
