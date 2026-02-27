import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import { NotificationSystem } from './NotificationSystem';

describe('NotificationSystem', () => {
  it('renders without crashing when there are no notifications', () => {
    renderWithProviders(<NotificationSystem />, {
      preloadedState: {
        notifications: {
          notifications: [],
        },
      } as any,
      useMemoryRouter: true,
    });

    // No alerts should be visible
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders notifications from the store', () => {
    renderWithProviders(<NotificationSystem />, {
      preloadedState: {
        notifications: {
          notifications: [
            {
              id: '1',
              type: 'success',
              message: 'Order placed successfully',
              title: 'Success',
              autoHide: true,
            },
          ],
        },
      } as any,
      useMemoryRouter: true,
    });

    expect(screen.getByText(/Order placed successfully/)).toBeInTheDocument();
  });

  it('renders multiple notifications', () => {
    renderWithProviders(<NotificationSystem />, {
      preloadedState: {
        notifications: {
          notifications: [
            { id: '1', type: 'success', message: 'First notification', autoHide: true },
            { id: '2', type: 'error', message: 'Second notification', autoHide: true },
            { id: '3', type: 'warning', message: 'Third notification', autoHide: true },
          ],
        },
      } as any,
      useMemoryRouter: true,
    });

    expect(screen.getByText('First notification')).toBeInTheDocument();
    expect(screen.getByText('Second notification')).toBeInTheDocument();
    expect(screen.getByText('Third notification')).toBeInTheDocument();
  });

  it('limits displayed notifications to 5', () => {
    const notifications = Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      type: 'info' as const,
      message: `Notification ${i + 1}`,
      autoHide: true,
    }));

    renderWithProviders(<NotificationSystem />, {
      preloadedState: {
        notifications: { notifications },
      } as any,
      useMemoryRouter: true,
    });

    // Only first 5 should be rendered
    expect(screen.getByText('Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Notification 5')).toBeInTheDocument();
    expect(screen.queryByText('Notification 6')).not.toBeInTheDocument();
  });

  it('renders notification title when provided', () => {
    renderWithProviders(<NotificationSystem />, {
      preloadedState: {
        notifications: {
          notifications: [
            {
              id: '1',
              type: 'info',
              message: 'Check your email',
              title: 'Important',
              autoHide: true,
            },
          ],
        },
      } as any,
      useMemoryRouter: true,
    });

    expect(screen.getByText(/Important/)).toBeInTheDocument();
    expect(screen.getByText(/Check your email/)).toBeInTheDocument();
  });
});
