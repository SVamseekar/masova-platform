import { Link } from 'react-router-dom';
import BrowseShell from './components/BrowseShell';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import { browseStoreId } from './components/useBrowseMenu';

export default function PromotionsPage() {
  const selectedId = useAppSelector(selectSelectedStoreId);
  const stores = useGetActiveStoresQuery();
  const store = stores.data?.find(candidate => browseStoreId(candidate) === selectedId || candidate.id === selectedId);
  return <BrowseShell><main className="browse-offers">
    <h1>Special offers</h1><p>{store ? `Offers for ${store.name}.` : 'Choose your store to view availability.'}</p>
    {stores.isLoading ? <p role="status">Loading stores…</p> : stores.isError ? <div role="alert"><p>Store availability could not be loaded.</p><button type="button" onClick={() => stores.refetch()}>Retry stores</button></div> : <section className="browse-empty"><h2>Online offers unavailable</h2><p>Current offers cannot be retrieved online. Ask your selected store about available promotions. Discounts are confirmed at checkout.</p><Link className="browse-primary" to="/menu">Browse menu</Link></section>}
  </main></BrowseShell>;
}
