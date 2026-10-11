import { useState } from 'react';
import { Dialog, useMediaQuery } from '@mui/material';
import { X, Minus, Plus } from 'lucide-react';
import { type MenuItem, useGetMenuItemQuery } from '../../../store/api/menuApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useGetCustomerByUserIdQuery } from '../../../store/api/customerApi';
import { addToCart } from '../../../store/slices/cartSlice';
import { ALLERGEN_LABELS } from '../../../constants/allergens';
import { apiPriceToCartMajor, formatApiPrice } from '../../../utils/currency';
import { revampCssVariables } from '../../../styles/design-tokens';
import { DishImage } from './DishCard';

export default function DishCustomization({ item: listedItem, currency, locale, onClose, canAdd }: { item: MenuItem; currency: string; locale: string; onClose: () => void; canAdd: boolean }) {
  const dispatch = useAppDispatch();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const user = useAppSelector(state => state.auth.user);
  const customer = useGetCustomerByUserIdQuery(user?.id || '', { skip: user?.type !== 'CUSTOMER' });
  const fresh = useGetMenuItemQuery(listedItem.id, { refetchOnMountOrArgChange: true });
  const item = fresh.currentData || listedItem;
  const refreshed = !!fresh.currentData && !fresh.isFetching && !fresh.isError && item.id === listedItem.id && item.storeId === listedItem.storeId;
  const [variant, setVariant] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const chosenVariant = item.variants?.find(option => option.name === variant);
  const modifiers = (item.customizations || []).filter(option => option.isAvailable && extras.includes(option.name));
  const unitPrice = item.basePrice + (chosenVariant?.priceModifier || 0) + modifiers.reduce((sum, option) => sum + option.price, 0);
  const variantRequired = !!item.variants?.length;
  const extrasValid = extras.every(name => item.customizations?.some(option => option.name === name && option.isAvailable));
  const ready = canAdd && refreshed && extrasValid && item.isAvailable && (!variantRequired || (!!chosenVariant && chosenVariant.isAvailable !== false));
  const flagged = item.allergens?.filter(allergen => customer.currentData?.preferences?.allergenAlerts?.includes(allergen)) || [];
  const add = () => {
    if (!ready) return;
    dispatch(addToCart({ id: item.id, name: item.name, price: apiPriceToCartMajor(unitPrice, currency), quantity, variant: chosenVariant?.name, customizations: modifiers.map(option => option.name), imageUrl: item.imageUrl, category: item.category }));
    onClose();
  };
  return <Dialog open onClose={onClose} transitionDuration={reducedMotion ? 0 : 180} fullWidth maxWidth="md" aria-labelledby="dish-title" slotProps={{ paper: { className: 'customer-browse-dialog', style: revampCssVariables } }}>
    <div className="browse-dialog-content"><button type="button" className="browse-dialog-close" aria-label="Close dish customisation" onClick={onClose}><X size={20} /></button>
      <div className="browse-customization">
        <div className="browse-customization-photo"><DishImage item={item} eager /></div>
        <div><h2 id="dish-title">{item.name}</h2><strong>{formatApiPrice(item.basePrice, currency, locale)}</strong><p>{item.description}</p>
          <div className="browse-badges">{item.allergens?.map(allergen => <span key={allergen}>{ALLERGEN_LABELS[allergen]}</span>)}</div>
          {!!flagged.length && <p className="browse-warning" role="alert">Contains allergens you've flagged: {flagged.map(allergen => ALLERGEN_LABELS[allergen]).join(', ')}</p>}
          {!item.allergensDeclared && <p className="browse-warning">Allergen information not confirmed. Ask the store before ordering.</p>}
          {item.ingredients?.length ? <p><strong>Ingredients: </strong>{item.ingredients.join(', ')}</p> : null}
          {item.spiceLevel && <p><strong>Spice level: </strong>{item.spiceLevel.toLowerCase().replace(/_/g, ' ')}</p>}
          {variantRequired && <fieldset><legend>Size / variant (required)</legend>{item.variants!.map(option => <label className="browse-option" key={option.name}><input type="radio" name="dish-variant" value={option.name} checked={variant === option.name} disabled={option.isAvailable === false} onChange={() => setVariant(option.name)} /><span>{option.name}{option.isAvailable === false ? ' · Unavailable' : ''}</span><strong>{formatApiPrice(item.basePrice + option.priceModifier, currency, locale)}</strong></label>)}</fieldset>}
          {!!item.customizations?.length && <fieldset><legend>Customisations (optional)</legend>{item.customizations.map(option => <label className="browse-option" key={option.name}><input type="checkbox" checked={extras.includes(option.name)} disabled={!option.isAvailable} onChange={event => setExtras(current => event.target.checked ? [...current, option.name] : current.filter(name => name !== option.name))} /><span>{option.name}{!option.isAvailable ? ' · Unavailable' : ''}</span><strong>{formatApiPrice(option.price, currency, locale)}</strong></label>)}</fieldset>}
          <div className="browse-quantity" role="group" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(current => current - 1)}><Minus size={18} /></button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(current => current + 1)}><Plus size={18} /></button></div>
          <p className="browse-price-row"><span>Menu subtotal</span><strong>{formatApiPrice(unitPrice * quantity, currency, locale)}</strong></p>
          <button type="button" className="browse-primary browse-full" disabled={!ready} onClick={add}>Add to cart</button>
          {fresh.isFetching && <p role="status">Checking current price and availability…</p>}
          {fresh.isError && <div role="alert"><p>Current dish availability could not be confirmed.</p><button type="button" onClick={() => fresh.refetch()}>Retry dish</button></div>}
          {!item.isAvailable && <p role="status">This dish is sold out.</p>}
          {!extrasValid && <p role="alert">A selected customisation is unavailable. Remove it before adding.</p>}
          {chosenVariant?.isAvailable === false && <p role="alert">Your selected size is unavailable. Choose another size before adding.</p>}
          {!canAdd && <p role="status">Ordering unavailable. Reconnect or reload the menu before adding items.</p>}
        </div>
      </div>
    </div>
  </Dialog>;
}
