import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrowseShell from './components/BrowseShell';
import BrowseStatus from './components/BrowseStatus';
import DishCard from './components/DishCard';
import DishCustomization from './components/DishCustomization';
import { useBrowseMenu } from './components/useBrowseMenu';

const label = (value: string) => value.toLowerCase().replace(/_/g, ' ');

export default function HomePage() {
  const browse = useBrowseMenu();
  const [dishId, setDishId] = useState<{ id: string; storeId: string | null } | null>(null);
  const dish = browse.items.find(item => item.id === dishId?.id && browse.selectedStoreId === dishId?.storeId);
  const popular = [...browse.items].sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended) || a.displayOrder - b.displayOrder).slice(0, 8);
  const cuisines = [...new Set(browse.items.map(item => item.cuisine))];
  return <BrowseShell>
    <main className="browse-home">
      <section className="browse-hero">
        <div><h1>Good food<br />for every moment</h1><p>{browse.selectedStore ? `Explore the menu at ${browse.selectedStore.name}.` : 'Choose your store and find your next favourite dish.'}</p><Link className="browse-primary" to="/menu">Explore menu</Link><p className="browse-hero-note">Choose delivery or pickup at checkout. Delivery availability and fees depend on your address.</p></div>
        <img src="/images/menu/butter-chicken.jpg" alt="Butter chicken with fresh herbs" />
      </section>
      <BrowseStatus browse={browse} />
      {!!cuisines.length && <nav className="browse-cuisines" aria-label="Browse by cuisine">{cuisines.map(cuisine => <Link key={cuisine} to={`/menu?cuisine=${cuisine}`}><span>{label(cuisine)}</span></Link>)}</nav>}
      <div className="browse-section-title"><h2>Discover dishes</h2><Link to="/menu">See all</Link></div>
      {browse.storeReady && !browse.menu.isLoading && !browse.menu.isError && !popular.length && <p role="status">No dishes are available at this store yet.</p>}
      <div className="browse-grid">{popular.map(item => <DishCard key={item.id} item={item} currency={browse.market.currency} locale={browse.market.locale} disabled={!browse.online || !browse.canOrder || browse.menu.isFetching} onOpen={() => setDishId({ id: item.id, storeId: browse.selectedStoreId })} />)}</div>
      {dish && <DishCustomization key={`${browse.selectedStoreId}:${dish.id}`} item={dish} currency={browse.market.currency} locale={browse.market.locale} canAdd={browse.online && browse.canOrder && !browse.menu.isFetching} onClose={() => setDishId(null)} />}
    </main>
  </BrowseShell>;
}
