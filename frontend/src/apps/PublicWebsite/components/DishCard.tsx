import { useState } from 'react';
import { Flame, Leaf, Plus, Star, Utensils } from 'lucide-react';
import { DietaryType, SpiceLevel, type MenuItem } from '../../../store/api/menuApi';
import { ALLERGEN_LABELS } from '../../../constants/allergens';
import { formatApiPrice } from '../../../utils/currency';

export function DishImage({ item, eager = false }: { item: MenuItem; eager?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return item.imageUrl && failedUrl !== item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedUrl(item.imageUrl)} /> : <div className="browse-image-placeholder"><Utensils size={32} aria-hidden="true" /><span>Photo unavailable</span></div>;
}

/** Short chip text; the full legal allergen name stays in the dish dialog and the accessible label. */
export const ALLERGEN_CHIP: Partial<Record<string, string>> = { CEREALS_GLUTEN: 'Gluten', MILK: 'Milk', NUTS: 'Nuts', SULPHUR_DIOXIDE: 'Sulphites', CRUSTACEANS: 'Shellfish' };
/** Star rating, shown only when the dish has ratings. */
export function DishRating({ item, withCount }: { item: MenuItem; withCount?: boolean }) {
  if (!item.averageRating || !item.ratingCount) return null;
  const value = item.averageRating.toFixed(1);
  return <span className="browse-rating" aria-label={`Rated ${value} out of 5 from ${item.ratingCount} ratings`}><Star size={14} fill="currentColor" aria-hidden="true" /><span aria-hidden="true">{value}{withCount ? ` (${item.ratingCount})` : ''}</span></span>;
}

const PLANT_BASED = [DietaryType.VEGETARIAN, DietaryType.VEGAN, DietaryType.JAIN];
const HOT = [SpiceLevel.HOT, SpiceLevel.EXTRA_HOT];

/** Dish tile. The compact form is the home page row: photo, name and price only. */
export default function DishCard({ item, currency, locale, onOpen, disabled, compact }: { item: MenuItem; currency: string; locale: string; onOpen: () => void; disabled?: boolean; compact?: boolean }) {
  const plantBased = item.dietaryInfo?.find(diet => PLANT_BASED.includes(diet));
  const hot = !!item.spiceLevel && HOT.includes(item.spiceLevel);
  return <article className={'browse-dish' + (compact ? ' browse-dish-compact' : '') + (item.isAvailable ? '' : ' browse-dish-sold-out')}>
    <div className="browse-dish-photo"><DishImage item={item} />{!item.isAvailable && <span className="browse-sold-out">Sold out</span>}<button type="button" className="browse-dish-add" onClick={onOpen} disabled={disabled || !item.isAvailable} aria-label={`Customise ${item.name}`}><Plus size={20} aria-hidden="true" /></button></div>
    <div className="browse-dish-content">
      <h3>{item.name}{plantBased && <span className="browse-diet-mark" title={plantBased.toLowerCase().replace(/_/g, ' ')}><Leaf size={12} aria-hidden="true" /><span className="sr-only">{plantBased.toLowerCase().replace(/_/g, ' ')}</span></span>}{hot && <span className="browse-hot-mark" title="Hot"><Flame size={14} aria-hidden="true" /><span className="sr-only">Hot</span></span>}</h3>
      {!compact && <p>{item.description}</p>}
      <div className="browse-dish-bottom"><strong>{formatApiPrice(item.basePrice, currency, locale)}</strong><DishRating item={item} /></div>
      {!compact && !!item.allergens?.length && <div className="browse-badges" aria-label={`Allergens: ${item.allergens.map(allergen => ALLERGEN_LABELS[allergen]).join(', ')}`}>{item.allergens.slice(0, 2).map(allergen => <span key={allergen}>{ALLERGEN_CHIP[allergen] || ALLERGEN_LABELS[allergen]}</span>)}{item.allergens.length > 2 && <span className="browse-badge-more">+{item.allergens.length - 2}</span>}</div>}
      {!compact && !item.allergensDeclared && <small>Allergen information not confirmed. Ask the store before ordering.</small>}
    </div>
  </article>;
}
