import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { ChatWidget } from './ChatWidget';

describe('ChatWidget', () => {
  it.each(['/', '/de/pricing', '/privacy'])('renders nothing on the getmasova.rest page %s', (path) => {
    const { container } = renderWithProviders(<ChatWidget />, { initialEntries: [path], useMemoryRouter: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the chat launcher on the ordering app', () => {
    renderWithProviders(<ChatWidget />, { initialEntries: ['/order'], useMemoryRouter: true });
    expect(screen.getByRole('button', { name: /^Open / })).toBeInTheDocument();
  });
});
