import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Beef, CakeSlice, CupSoda, Flame, LayoutGrid, Pizza, Salad, Search, Soup, Utensils, Wheat, X, type LucideIcon } from 'lucide-react';
import { Cuisine, DietaryType } from '../../store/api/menuApi';
import { ALLERGEN_LABELS, type AllergenType } from '../../constants/allergens';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import BrowseStatus from '../../apps/PublicWebsite/components/BrowseStatus';
import DishCard from '../../apps/PublicWebsite/components/DishCard';
import DishCustomization from '../../apps/PublicWebsite/components/DishCustomization';
import { useBrowseMenu } from '../../apps/PublicWebsite/components/useBrowseMenu';

export interface AllergenWarningBannerProps { itemAllergens: AllergenType[]; customerAllergenAlerts: AllergenType[] }
export function AllergenWarningBanner({ itemAllergens, customerAllergenAlerts }: AllergenWarningBannerProps) {
  const matches = itemAllergens.filter(allergen => customerAllergenAlerts.includes(allergen));
  return matches.length ? <p className="browse-warning" role="alert">Contains allergens you've flagged: {matches.map(allergen => ALLERGEN_LABELS[allergen]).join(', ')}</p> : null;
}

interface MenuPageProps { hideStaffLogin?: boolean; showPublicNav?: boolean; onCartClick?: () => void }
const label = (value: string) => value.toLowerCase().replace(/_/g, ' ');

const DIETARY_LABELS: Record<string, string> = { VEGETARIAN: 'Vegetarian', VEGAN: 'Vegan', NON_VEGETARIAN: 'Non-veg', CONTAINS_EGGS: 'Eggs', HALAL: 'Halal', JAIN: 'Jain' };
const CUISINE_ICONS: Record<string, LucideIcon> = { SOUTH_INDIAN: Wheat, NORTH_INDIAN: Flame, INDO_CHINESE: Soup, ITALIAN: Pizza, AMERICAN: Beef, CONTINENTAL: Salad, BEVERAGES: CupSoda, DESSERTS: CakeSlice };

export default function MenuPage({ onCartClick }: MenuPageProps) {
  const browse = useBrowseMenu();
  const [params, setParams] = useSearchParams();
  const cuisine = params.get('cuisine') || '';
  const category = params.get('category') || '';
  const dietary = params.get('dietary') || '';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'recommended';
  const [dishId, setDishId] = useState<{ id: string; storeId: string | null } | null>(null);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'cuisine') next.delete('category');
    setParams(next, { replace: key === 'search' });
  };
  const categories = [...new Set(browse.items.filter(item => !cuisine || item.cuisine === cuisine).map(item => item.category))];
  const items = browse.items.filter(item => (!cuisine || item.cuisine === cuisine) && (!category || item.category === category) && (!dietary || item.dietaryInfo?.includes(dietary as DietaryType)) && (!search.trim() || [item.name, item.description, item.cuisine, ...(item.ingredients || [])].join(' ').toLowerCase().replace(/_/g, ' ').includes(search.trim().toLowerCase()))).sort((a, b) => sort === 'price-asc' ? a.basePrice - b.basePrice : sort === 'price-desc' ? b.basePrice - a.basePrice : sort === 'name' ? a.name.localeCompare(b.name) : Number(b.isRecommended) - Number(a.isRecommended) || a.displayOrder - b.displayOrder);
  const dish = browse.items.find(item => item.id === dishId?.id && browse.selectedStoreId === dishId?.storeId);
  const active = [['cuisine', cuisine], ['category', category], ['dietary', dietary], ['search', search]].filter(([, value]) => value);
  return <BrowseShell onCartClick={onCartClick}>
    <main className="browse-menu">
      <aside className="browse-sidebar"><h1>Menu</h1><nav aria-label="Cuisine"><button type="button" aria-pressed={!cuisine} onClick={() => change('cuisine', '')}><LayoutGrid size={18} aria-hidden="true" />All dishes</button>{Object.values(Cuisine).map(value => { const Icon = CUISINE_ICONS[value] || Utensils; return <button type="button" key={value} aria-pressed={cuisine === value} onClick={() => change('cuisine', value)}><Icon size={18} aria-hidden="true" />{label(value)}</button>; })}</nav></aside>
      <section className="browse-results" aria-label="Menu results">
        <div className="browse-search-row"><label className="browse-search"><span className="sr-only">Search dishes</span><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search for dishes, ingredients or cuisines…" value={search} onChange={event => change('search', event.target.value)} /></label><label className="browse-sort"><span>Sort by</span><select value={sort} onChange={event => change('sort', event.target.value)}><option value="recommended">Popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></label></div>
        <div className="browse-filters"><label><span className="sr-only">Cuisine</span><select value={cuisine} onChange={event => change('cuisine', event.target.value)}><option value="">All cuisines</option>{Object.values(Cuisine).map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><label><span className="sr-only">Category</span><select value={category} onChange={event => change('category', event.target.value)}><option value="">All categories</option>{categories.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><div className="browse-dietary" role="group" aria-label="Dietary filters"><button type="button" aria-pressed={!dietary} onClick={() => change('dietary', '')}>All dietary</button>{Object.values(DietaryType).map(value => <button type="button" key={value} aria-pressed={dietary === value} onClick={() => change('dietary', value)}>{DIETARY_LABELS[value] || label(value)}</button>)}</div></div>
        <div className="browse-result-count"><div className="browse-active-filters">{active.map(([key, value]) => <button type="button" key={key} aria-label={`Clear ${key} filter: ${label(value)}`} onClick={() => change(key, '')}>{label(value)}<X size={14} aria-hidden="true" /></button>)}{!!active.length && <button type="button" className="browse-clear-all" onClick={() => setParams({})}>Clear all</button>}</div><span role="status">{items.length} {items.length === 1 ? 'dish' : 'dishes'} found</span></div>
        <BrowseStatus browse={browse} />
        {browse.storeReady && !browse.menu.isLoading && !browse.menu.isFetching && !browse.menu.isError && items.length === 0 && <div className="browse-empty"><h2>No dishes found</h2><p>Try adjusting your filters or choose another store.</p>{!!active.length && <button type="button" onClick={() => setParams({})}>Reset filters</button>}</div>}
        <div className="browse-grid">{items.map(item => <DishCard key={item.id} item={item} currency={browse.market.currency} locale={browse.market.locale} disabled={!browse.online || !browse.canOrder || browse.menu.isFetching} onOpen={() => setDishId({ id: item.id, storeId: browse.selectedStoreId })} />)}</div>
      </section>
      {dish && <DishCustomization key={`${browse.selectedStoreId}:${dish.id}`} item={dish} currency={browse.market.currency} locale={browse.market.locale} canAdd={browse.online && browse.canOrder && !browse.menu.isFetching} onClose={() => setDishId(null)} />}
    </main>
  </BrowseShell>;
}
