import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ConnectionMonitorProvider } from './ConnectionMonitorProvider';

const events = vi.hoisted(() => ({
  dispatch: vi.fn(), callbacks: [] as Array<(() => void) | undefined>,
}));
vi.mock('react-redux', () => ({ useDispatch: () => events.dispatch }));
vi.mock('../../services/websocketService', () => ({ websocketService: {
  setConnectionLostCallbacks: (...callbacks: Array<(() => void) | undefined>) => { events.callbacks = callbacks; },
} }));
vi.mock('../../config/api.config', () => ({ default: { BASE_URL: 'http://localhost:8080/api' } }));

beforeEach(() => { vi.clearAllMocks(); events.callbacks = []; });

it('retains identity and preferences through a prolonged service outage', () => {
  render(<ConnectionMonitorProvider><p>Current workspace</p></ConnectionMonitorProvider>);
  act(() => events.callbacks[1]?.());
  expect(events.dispatch).not.toHaveBeenCalled();
  expect(localStorage.clear).not.toHaveBeenCalled();
  expect(sessionStorage.clear).not.toHaveBeenCalled();
  expect(screen.getByText('Current workspace')).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('Connection unavailable');
});

it('clears the warning after actual reconnection and releases callbacks on unmount', () => {
  const view = render(<ConnectionMonitorProvider><p>Current workspace</p></ConnectionMonitorProvider>);
  act(() => events.callbacks[0]?.());
  expect(screen.getByRole('status')).toBeVisible();
  expect(events.callbacks[2]).toBeTypeOf('function');
  act(() => events.callbacks[2]?.());
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  view.unmount();
  expect(events.callbacks.every(callback => !callback)).toBe(true);
});
