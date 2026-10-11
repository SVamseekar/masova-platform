import { useState } from 'react';
import { Plus, Utensils } from 'lucide-react';
import type { MenuItem } from '../../../store/api/menuApi';
import { ALLERGEN_LABELS } from '../../../constants/allergens';
import { formatApiPrice } from '../../../utils/currency';

export function DishImage({ item, eager = false }: { item: MenuItem; eager?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return item.imageUrl && failedUrl !== item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedUrl(item.imageUrl)} /> : <div className="browse-image-placeholder"><Utensils size={32} aria-hidden="true" /><span>Photo unavailable</span></div>;
}

export default function DishCard({ item, currency, locale, onOpen, disabled }: { item: MenuItem; currency: string; locale: string; onOpen: () => void; disabled?: boolean }) {
  return <article className="browse-dish">
    <div className="browse-dish-photo"><DishImage item={item} />{!item.isAvailable && <span className="browse-sold-out">Sold out</span>}</div>
    <div className="browse-dish-content">
      <h3>{item.name}</h3><p>{item.description}</p>
      <div className="browse-dish-bottom"><strong>{formatApiPrice(item.basePrice, currency, locale)}</strong><button type="button" onClick={onOpen} disabled={disabled || !item.isAvailable} aria-label={`Customise ${item.name}`}><Plus size={20} aria-hidden="true" /></button></div>
      <div className="browse-badges">{item.dietaryInfo?.map(diet => <span key={diet}>{diet.toLowerCase().replace(/_/g, ' ')}</span>)}{item.allergens?.map(allergen => <span key={allergen}>{ALLERGEN_LABELS[allergen]}</span>)}</div>
      {!item.allergensDeclared && <small>Allergen information not confirmed. Ask the store before ordering.</small>}
    </div>
  </article>;
}
