import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, ChevronRight, MapPin, ShoppingBag } from 'lucide-react';
import BrowseShell from './components/BrowseShell';
import BrowseStatus from './components/BrowseStatus';
import DishCard, { DishImage } from './components/DishCard';
import DishCustomization from './components/DishCustomization';
import { storeDisplayName } from './components/CustomerStoreSelector';
import { useBrowseMenu } from './components/useBrowseMenu';
import { readOrderTypePreference, saveOrderTypePreference, type OrderTypePreference } from '../../utils/orderTypePreference';

const label = (value: string) => value.toLowerCase().replace(/_/g, ' ');
const CUISINE_NOTES: Record<string, string> = {
  SOUTH_INDIAN: 'Dosa, idly & more', NORTH_INDIAN: 'Classic curries, biryani & more', INDO_CHINESE: 'Noodles & fried rice', ITALIAN: 'Pizza & pasta',
  AMERICAN: 'Burgers, freshly made', CONTINENTAL: 'European favourites', BEVERAGES: 'Hot & cold drinks', DESSERTS: 'Sweet finish',
};

export default function HomePage() {
  const browse = useBrowseMenu();
  const [dishId, setDishId] = useState<{ id: string; storeId: string | null } | null>(null);
  const [orderType, setOrderType] = useState<OrderTypePreference>(readOrderTypePreference);
  const dish = browse.items.find(item => item.id === dishId?.id && browse.selectedStoreId === dishId?.storeId);
  const popular = [...browse.items].sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended) || a.displayOrder - b.displayOrder).slice(0, 8);
  const cuisines = [...new Set(browse.items.map(item => item.cuisine))];
  const area = browse.selectedStore ? storeDisplayName(browse.selectedStore.name) : '';
  const choose = (value: OrderTypePreference) => {
    setOrderType(value);
    saveOrderTypePreference(value);
  };
  return <BrowseShell>
    <main className="browse-home">
      <section className="browse-hero">
        <img src="/images/menu/butter-chicken.jpg" alt="" />
        <div className="browse-hero-copy">
          <h1>Good food<br />for every moment</h1>
          <p>{area ? `Authentic flavours from our kitchen in ${area}. Fresh ingredients, made with care.` : 'Choose your store and find your next favourite dish.'}</p>
          <div className="browse-order-type" role="group" aria-label="Order type">
            <button type="button" aria-pressed={orderType === 'DELIVERY'} onClick={() => choose('DELIVERY')}><Bike size={20} aria-hidden="true" />Delivery</button>
            <button type="button" aria-pressed={orderType === 'TAKEAWAY'} onClick={() => choose('TAKEAWAY')}><ShoppingBag size={20} aria-hidden="true" />Pickup</button>
          </div>
          <Link className="browse-deliver-to" to="/menu">
            <MapPin size={20} aria-hidden="true" />
            <span><small>{orderType === 'DELIVERY' ? 'Deliver to' : 'Pick up from'}</small>{orderType === 'DELIVERY' ? `Your address${area ? ` in ${area}` : ''}, entered at checkout` : area || 'Choose your store above'}</span>
            <strong>See menu</strong><ChevronRight size={18} aria-hidden="true" />
          </Link>
          <p className="browse-hero-note">{orderType === 'DELIVERY' ? 'Delivery fee calculated by distance at checkout' : 'No delivery fee for pickup orders'}</p>
        </div>
      </section>
      <BrowseStatus browse={browse} />
      {!!cuisines.length && <nav className="browse-cuisines" aria-label="Browse by cuisine">{cuisines.map(cuisine => {
        const sample = browse.items.find(item => item.cuisine === cuisine && item.imageUrl);
        return <Link key={cuisine} to={`/menu?cuisine=${cuisine}`}>{sample && <span className="browse-cuisine-photo"><DishImage item={{ ...sample, name: '' }} /></span>}<strong>{label(cuisine)}</strong>{CUISINE_NOTES[cuisine] && <small>{CUISINE_NOTES[cuisine]}</small>}</Link>;
      })}</nav>}
      <div className="browse-section-title"><h2>Popular dishes</h2><Link to="/menu">See all</Link></div>
      {browse.storeReady && !browse.menu.isLoading && !browse.menu.isError && !popular.length && <p role="status">No dishes are available at this store yet.</p>}
      <div className="browse-grid browse-grid-row">{popular.map(item => <DishCard key={item.id} compact item={item} currency={browse.market.currency} locale={browse.market.locale} disabled={!browse.online || !browse.canOrder || browse.menu.isFetching} onOpen={() => setDishId({ id: item.id, storeId: browse.selectedStoreId })} />)}</div>
      {dish && <DishCustomization key={`${browse.selectedStoreId}:${dish.id}`} item={dish} currency={browse.market.currency} locale={browse.market.locale} canAdd={browse.online && browse.canOrder && !browse.menu.isFetching} onClose={() => setDishId(null)} />}
    </main>
  </BrowseShell>;
}
