import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Utensils } from 'lucide-react';
import BrowseShell from './components/BrowseShell';
import CustomerStoreSelector, { storeDisplayName } from './components/CustomerStoreSelector';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { useGetStoreOffersQuery, type StoreOffer } from '../../store/api/menuApi';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import { browseStoreId } from './components/useBrowseMenu';

const ALL = 'All offers';

const formatValidUntil = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

function OfferCard({ offer }: { offer: StoreOffer }) {
  const [imageFailed, setImageFailed] = useState(false);
  const validUntil = offer.validUntil ? formatValidUntil(offer.validUntil) : null;
  return <li className="browse-offer-card">
    <div className="browse-offer-image">
      {offer.imageUrl && !imageFailed && <img src={offer.imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />}
      {offer.badge && <span className="browse-offer-badge">{offer.badge}</span>}
    </div>
    <h2>{offer.title}</h2>
    {offer.description && <p>{offer.description}</p>}
    <ul className="browse-offer-terms">
      {validUntil && <li><CalendarDays size={16} aria-hidden="true" />Valid until {validUntil}</li>}
      {offer.appliesTo && <li><Utensils size={16} aria-hidden="true" />{offer.appliesTo}</li>}
      {offer.redemption && <li><Clock size={16} aria-hidden="true" />{offer.redemption}</li>}
    </ul>
  </li>;
}

export default function PromotionsPage() {
  const selectedId = useAppSelector(selectSelectedStoreId);
  const stores = useGetActiveStoresQuery();
  const store = stores.data?.find(candidate => browseStoreId(candidate) === selectedId || candidate.id === selectedId);
  const storeId = store ? browseStoreId(store) : '';
  const offers = useGetStoreOffersQuery(storeId, { skip: !storeId });
  const [category, setCategory] = useState(ALL);

  const list = offers.data ?? [];
  const categories = [ALL, ...Array.from(new Set(list.map(offer => offer.category).filter((value): value is string => !!value)))];
  const active = categories.includes(category) ? category : ALL;
  const shown = active === ALL ? list : list.filter(offer => offer.category === active);

  return <BrowseShell><main className="browse-offers">
    <div className="browse-offers-head">
      <div>
        <h1>Special offers</h1>
        <p>{store ? `Great food, better together. Available at ${storeDisplayName(store.name)}.` : 'Choose your store to see its offers.'}</p>
      </div>
      <CustomerStoreSelector id="offers-store-select" card />
    </div>
    {stores.isLoading || (storeId && offers.isLoading) ? <p role="status">Loading offers…</p>
      : stores.isError ? <div role="alert" className="browse-empty"><p>Store availability could not be loaded.</p><button type="button" onClick={() => stores.refetch()}>Retry stores</button></div>
      : !storeId ? <section className="browse-empty"><h2>Choose your store</h2><p>Offers depend on the store that prepares your order.</p></section>
      : offers.isError ? <div role="alert" className="browse-empty"><p>Offers could not be loaded.</p><button type="button" onClick={() => offers.refetch()}>Retry offers</button></div>
      : list.length === 0 ? <section className="browse-empty"><h2>No offers right now</h2><p>{storeDisplayName(store?.name ?? 'This store')} has no current offers. Check again soon.</p><Link className="browse-primary" to="/menu">Browse menu</Link></section>
      : <>
        <div className="browse-offer-filters" role="group" aria-label="Filter offers">
          {categories.map(name => <button type="button" key={name} aria-pressed={active === name} onClick={() => setCategory(name)}>{name}</button>)}
        </div>
        <ul className="browse-offer-grid">{shown.map(offer => <OfferCard key={offer.id} offer={offer} />)}</ul>
      </>}
  </main></BrowseShell>;
}
