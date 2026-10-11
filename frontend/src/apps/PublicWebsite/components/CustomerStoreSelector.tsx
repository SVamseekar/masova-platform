import { useState } from 'react';
import { Dialog, useMediaQuery } from '@mui/material';
import { MapPin } from 'lucide-react';
import { useGetActiveStoresQuery, type Store } from '../../../store/api/storeApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectSelectedStoreId, selectCartItemCount, setSelectedStore, setStoreCurrency } from '../../../store/slices/cartSlice';
import { resolveStoreMarket, storeCurrencyPayload } from '../../../utils/storeCurrency';
import { revampCssVariables } from '../../../styles/design-tokens';
import { browseStoreId } from './useBrowseMenu';

export default function CustomerStoreSelector() {
  const dispatch = useAppDispatch();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const selectedId = useAppSelector(selectSelectedStoreId);
  const count = useAppSelector(selectCartItemCount);
  const { data = [], isLoading, isError, refetch } = useGetActiveStoresQuery();
  const [pending, setPending] = useState<Store | null>(null);
  const stores = data.filter(store => store.status === 'ACTIVE');
  const selected = stores.find(store => browseStoreId(store) === selectedId || store.id === selectedId);
  const selectStore = (store: Store) => {
    const current = stores.find(candidate => candidate.id === store.id);
    if (!current || isError) return;
    dispatch(setSelectedStore({ storeId: browseStoreId(current), storeName: current.name }));
    if (resolveStoreMarket(current).resolved) dispatch(setStoreCurrency(storeCurrencyPayload(current)));
    setPending(null);
  };
  return <div className="browse-store">
    <MapPin size={18} aria-hidden="true" />
    <label className="sr-only" htmlFor="browse-store-select">Select store</label>
    <select id="browse-store-select" value={selected ? browseStoreId(selected) : ''} disabled={isLoading || isError} onChange={event => {
      const store = stores.find(candidate => browseStoreId(candidate) === event.target.value);
      if (!store) return;
      if (count > 0 && selectedId !== browseStoreId(store)) setPending(store);
      else selectStore(store);
    }}>
      <option value="">{isLoading ? 'Loading stores…' : isError ? 'Stores unavailable' : 'Choose your store'}</option>
      {stores.map(store => <option key={store.id} value={browseStoreId(store)}>{store.name}{store.address?.city ? ` · ${store.address.city}` : ''}</option>)}
    </select>
    {isError && <button type="button" onClick={() => refetch()}>Retry stores</button>}
    {!isLoading && !isError && stores.length === 0 && <span role="status">No stores available</span>}
    <Dialog open={!!pending} onClose={() => setPending(null)} transitionDuration={reducedMotion ? 0 : 180} aria-labelledby="change-store-title" slotProps={{ paper: { className: 'customer-browse-dialog', style: revampCssVariables } }}>
      <div className="browse-dialog-content">
        <h2 id="change-store-title">Change your store?</h2>
        <p>Your cart belongs to the current store. Changing to {pending?.name} will clear its items.</p>
        <div className="browse-actions"><button type="button" onClick={() => setPending(null)}>Keep current store</button><button type="button" className="browse-primary" disabled={isError || !stores.some(store => store.id === pending?.id)} onClick={() => pending && selectStore(pending)}>Change store and clear cart</button></div>
      </div>
    </Dialog>
  </div>;
}
