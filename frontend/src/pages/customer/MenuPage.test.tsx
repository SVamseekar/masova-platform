import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils/testUtils';
import { syncedEuCartPreload } from '@/test/defaultPreloadedState';
import MenuPage from './MenuPage';
import HomePage from '../../apps/PublicWebsite/HomePage';
import PublicMenuPage from '../../apps/PublicWebsite/PublicMenuPage';
import PromotionsPage from '../../apps/PublicWebsite/PromotionsPage';
import { Cuisine, DietaryType, MenuCategory, type MenuItem } from '../../store/api/menuApi';

const mocks = vi.hoisted(() => ({ stores: vi.fn(), menu: vi.fn(), dish: vi.fn(), retry: vi.fn() }));
vi.mock('../../store/api/storeApi', async () => ({ ...await vi.importActual('../../store/api/storeApi'), useGetActiveStoresQuery: () => mocks.stores() }));
vi.mock('../../store/api/menuApi', async () => ({ ...await vi.importActual('../../store/api/menuApi'), useGetAvailableMenuQuery: (...args: unknown[]) => mocks.menu(...args), useGetMenuItemQuery: (...args: unknown[]) => mocks.dish(...args) }));

const stores = [{ id: 'mongo-berlin', storeCode: 'DOM001', name: 'Berlin Mitte', status: 'ACTIVE', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', address: { city: 'Berlin' }, operatingConfig: {} }, { id: 'mongo-other', storeCode: 'DOM002', name: 'Other store', status: 'ACTIVE', countryCode: 'DE', currency: 'EUR', locale: 'de-DE', operatingConfig: {} }];
const pizza: MenuItem = { id: 'pizza', name: 'Margherita Pizza', description: 'Tomato and basil', cuisine: Cuisine.ITALIAN, category: MenuCategory.PIZZA, basePrice: 1200, variants: [{ name: 'Regular', priceModifier: 0 }, { name: 'Large', priceModifier: 400 }], customizations: [{ name: 'Olives', price: 200, isAvailable: true }], dietaryInfo: [DietaryType.VEGETARIAN], ingredients: ['Basil'], isAvailable: true, isRecommended: true, displayOrder: 0, storeId: 'DOM001', allergensDeclared: true, createdAt: '', updatedAt: '' };
const curry: MenuItem = { ...pizza, id: 'curry', name: 'Chicken Curry', cuisine: Cuisine.NORTH_INDIAN, category: MenuCategory.CURRY_GRAVY, variants: [], dietaryInfo: [DietaryType.NON_VEGETARIAN], basePrice: 1500 };
const render = (page = <MenuPage />, route = '/menu', cart = syncedEuCartPreload) => renderWithProviders(page, { useMemoryRouter: true, initialEntries: [route], preloadedState: { cart } });

beforeEach(() => {
  localStorage.clear();
  vi.mocked(sessionStorage.getItem).mockReturnValue(null);
  vi.mocked(localStorage.setItem).mockClear();
  mocks.stores.mockReturnValue({ data: stores, isLoading: false, isError: false, refetch: mocks.retry });
  mocks.menu.mockReturnValue({ currentData: [pizza, curry, { ...pizza, id: 'wrong-store', name: 'Other-store Pizza', storeId: 'DOM002' }], isLoading: false, isFetching: false, isError: false, refetch: mocks.retry });
  mocks.dish.mockReturnValue({ currentData: pizza, isFetching: false, isError: false, refetch: mocks.retry });
});

describe('customer web browse workflow', () => {
  it('scopes menu to store code and retains EUR amounts', () => {
    render(<PublicMenuPage />);
    expect(mocks.menu).toHaveBeenCalledWith('DOM001', { skip: false });
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Other-store Pizza')).not.toBeInTheDocument();
    expect(screen.getByText(/12,00/)).toHaveTextContent('€');
  });
  it('combines cuisine, diet and ingredient search; clears filters', async () => {
    const user = userEvent.setup(); render();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Cuisine' }), 'ITALIAN');
    await user.click(screen.getByRole('button', { name: 'vegetarian' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search dishes' }), 'basil');
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument();
    expect(screen.getByText('1 dish found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('Chicken Curry')).toBeInTheDocument();
  });
  it('requires current required variant and saves selected modifiers with backend ID', async () => {
    const user = userEvent.setup(); render();
    await user.click(screen.getByRole('button', { name: 'Customise Margherita Pizza' }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Large/ }));
    await user.click(screen.getByRole('checkbox', { name: /Olives/ }));
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    const saved = JSON.parse(vi.mocked(localStorage.setItem).mock.calls.slice(-1)[0][1]);
    expect(saved.items[0]).toMatchObject({ id: 'pizza', price: 18, variant: 'Large', customizations: ['Olives'], quantity: 1 });
    await user.click(screen.getByRole('button', { name: 'Open cart, 1 item' }));
    expect(screen.getByText('Your cart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to checkout' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Your cart' })).toHaveClass('browse-cart-drawer');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Your cart' })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open cart, 1 item' })).toHaveFocus());
  });
  it('blocks add when fresh dish was sold out or failed verification', async () => {
    mocks.dish.mockReturnValue({ currentData: { ...pizza, isAvailable: false }, isFetching: false, isError: false });
    const user = userEvent.setup(); render();
    await user.click(screen.getByRole('button', { name: 'Customise Margherita Pizza' }));
    await user.click(screen.getByRole('radio', { name: /Regular/ }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(screen.getByText('This dish is sold out.')).toBeInTheDocument();
  });
  it('keeps cart on cancelled store switch and clears only on confirmed switch', async () => {
    const cart = { ...syncedEuCartPreload, items: [{ id: 'pizza', name: 'Pizza', price: 12, quantity: 1 }], itemCount: 1, total: 12 };
    const user = userEvent.setup(); render(<MenuPage />, '/menu', cart);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Select store' }), 'DOM002');
    await user.click(screen.getByRole('button', { name: 'Keep current store' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open cart, 1 item' })).toBeInTheDocument());
    await user.selectOptions(screen.getByRole('combobox', { name: 'Select store' }), 'DOM002');
    await user.click(screen.getByRole('button', { name: 'Change store and clear cart' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open cart, 0 items' })).toBeInTheDocument());
    expect(JSON.parse(vi.mocked(localStorage.setItem).mock.calls.slice(-1)[0][1]).selectedStoreId).toBe('DOM002');
    expect(screen.queryByText('Margherita Pizza')).not.toBeInTheDocument();
  });
  it('blocks menu and shows retry on failed response', async () => {
    mocks.menu.mockReturnValue({ currentData: [pizza], isError: true, refetch: mocks.retry });
    const user = userEvent.setup(); render();
    expect(screen.queryByText('Margherita Pizza')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry menu' }));
    expect(mocks.retry).toHaveBeenCalled();
  });
  it('renders home with real dishes and cuisine links, excludes fictional delivery promises', () => {
    render(<HomePage />, '/order');
    expect(screen.getByRole('heading', { name: /Good food/ })).toBeInTheDocument();
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'italian' })).toHaveAttribute('href', '/menu?cuisine=ITALIAN');
    expect(screen.queryByText('30-Min Delivery')).not.toBeInTheDocument();
  });
  it('shows truthful offers limitation without synthetic codes or countdown', () => {
    render(<PromotionsPage />, '/promotions');
    expect(screen.getByRole('heading', { name: 'Online offers unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Any 2 Large Pizzas')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse menu' })).toHaveAttribute('href', '/menu');
  });
  it('blocks stale dish verification and permits retry without fabricating add success', async () => {
    mocks.dish.mockReturnValue({ currentData: pizza, isFetching: false, isError: true, refetch: mocks.retry });
    const user = userEvent.setup(); render();
    await user.click(screen.getByRole('button', { name: 'Customise Margherita Pizza' }));
    await user.click(screen.getByRole('radio', { name: /Regular/ }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Retry dish' }));
    expect(mocks.retry).toHaveBeenCalled();
  });
  it('permits offline browsing but disables dish mutation', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render();
    expect(screen.getByText(/You’re offline/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customise Margherita Pizza' })).toBeDisabled();
    online.mockRestore();
  });
  it('leaves storeless menu query skipped and asks for a store', () => {
    render(<MenuPage />, '/menu', { ...syncedEuCartPreload, selectedStoreId: null });
    expect(mocks.menu).toHaveBeenLastCalledWith(undefined, { skip: true });
    expect(screen.getByText('Choose a store to see its menu.')).toBeInTheDocument();
    expect(screen.queryByText('Margherita Pizza')).not.toBeInTheDocument();
  });
  it('disables unavailable variants and blocks a selected size after fresh availability changes', async () => {
    mocks.dish.mockReturnValue({ currentData: { ...pizza, variants: [{ name: 'Regular', priceModifier: 0, isAvailable: false }, { name: 'Large', priceModifier: 400, isAvailable: true }] }, isFetching: false, isError: false });
    const user = userEvent.setup();
    const view = render();
    await user.click(screen.getByRole('button', { name: 'Customise Margherita Pizza' }));
    expect(screen.getByRole('radio', { name: /Regular/ })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Large/ }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    mocks.dish.mockReturnValue({ currentData: { ...pizza, variants: [{ name: 'Regular', priceModifier: 0, isAvailable: false }, { name: 'Large', priceModifier: 400, isAvailable: false }] }, isFetching: false, isError: false });
    view.rerender(<MenuPage />);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });
  it('preserves guest active-order tracking navigation', () => {
    vi.mocked(sessionStorage.getItem).mockImplementation(key => key === 'activeOrderId' ? 'guest-order' : null);
    render();
    expect(screen.getByRole('link', { name: 'Track Order' })).toHaveAttribute('href', '/tracking/guest-order');
  });

});
