import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { CookieConsent, OPEN_COOKIE_PREFERENCES_EVENT } from './CookieConsent';

const grantConsent = vi.fn(() => ({ unwrap: () => Promise.resolve() }));
const revokeConsent = vi.fn(() => ({ unwrap: () => Promise.resolve() }));
vi.mock('../../store/api/gdprApi', () => ({ useGrantConsentMutation: () => [grantConsent], useRevokeConsentMutation: () => [revokeConsent] }));
let signedInUserId: string | undefined;
vi.mock('../../store/hooks', () => ({ useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth: { user: signedInUserId ? { id: signedInUserId } : null } }) }));

const renderAt = (path = '/') => render(<MemoryRouter initialEntries={[path]}><CookieConsent /></MemoryRouter>);
const stored = () => JSON.parse(localStorage.getItem('cookie_consent') ?? 'null');

// The shared test setup replaces localStorage with inert mocks, so back it with a map here.
const values = new Map<string, string>();

describe('Cookie preferences', () => {
  beforeEach(() => {
    values.clear();
    vi.mocked(localStorage.getItem).mockImplementation(key => values.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => { values.set(key, value); });
    grantConsent.mockClear();
    revokeConsent.mockClear();
    signedInUserId = undefined;
  });

  it('keeps optional cookies off until the visitor turns them on', async () => {
    const user = userEvent.setup();
    renderAt();
    expect(screen.getByRole('dialog', { name: 'Cookie preferences' })).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    const analytics = screen.getByRole('switch', { name: 'Analytics cookies' });
    const marketing = screen.getByRole('switch', { name: 'Marketing cookies' });
    expect(analytics).toHaveAttribute('aria-checked', 'false');
    expect(marketing).toHaveAttribute('aria-checked', 'false');
    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(stored()).toEqual({ necessary: true, functional: false, analytics: true, marketing: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores essential only even after a switch was turned on', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(screen.getByRole('switch', { name: 'Marketing cookies' }));
    await user.click(screen.getByRole('button', { name: 'Essential only' }));
    expect(stored()).toEqual({ necessary: true, functional: false, analytics: false, marketing: false });
  });

  it('records consent for a signed-in visitor', async () => {
    const user = userEvent.setup();
    signedInUserId = 'user-1';
    renderAt();
    await user.click(screen.getByRole('switch', { name: 'Analytics cookies' }));
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(grantConsent).toHaveBeenCalledTimes(1);
    expect(grantConsent).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', consentType: 'ANALYTICS_TRACKING' }));
  });

  it('stays closed after a choice and on legal documents', () => {
    const legal = renderAt('/privacy');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    legal.unmount();
    localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false }));
    renderAt('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reopens on request so consent can be withdrawn, and revokes it on the server', async () => {
    const user = userEvent.setup();
    signedInUserId = 'user-1';
    values.set('cookie_consent', JSON.stringify({ necessary: true, functional: false, analytics: true, marketing: false }));
    renderAt('/cookies');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => { window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT)); });
    const analytics = screen.getByRole('switch', { name: 'Analytics cookies' });
    expect(analytics).toHaveAttribute('aria-checked', 'true');
    await user.click(analytics);
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(stored().analytics).toBe(false);
    expect(revokeConsent).toHaveBeenCalledWith({ userId: 'user-1', consentType: 'ANALYTICS_TRACKING' });
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it('closes even when the choice cannot be stored on the device', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('blocked'); });
    renderAt();
    await user.click(screen.getByRole('button', { name: 'Essential only' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps keyboard focus inside the dialog', async () => {
    const user = userEvent.setup();
    renderAt();
    const save = screen.getByRole('button', { name: 'Save preferences' });
    save.focus();
    await user.tab();
    expect(screen.getByRole('switch', { name: 'Analytics cookies' })).toHaveFocus();
  });

  it('asks again when the stored choice is unreadable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('cookie_consent', '{broken');
    renderAt();
    expect(screen.getByRole('dialog', { name: 'Cookie preferences' })).toBeInTheDocument();
  });
});
