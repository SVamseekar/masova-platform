import { Drawer, useMediaQuery } from '@mui/material';
import { X, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectCartItems, selectCartCurrency, selectCartLocale, selectCartSubtotal, cartLineKey, updateItemQuantity, removeItemCompletely } from '../../../store/slices/cartSlice';
import { formatMajorAmount } from '../../../utils/currency';
import { revampCssVariables } from '../../../styles/design-tokens';

export default function BrowseCart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useAppSelector(selectCartItems);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return <Drawer anchor="right" open={open} onClose={onClose} transitionDuration={reducedMotion ? 0 : 180} slotProps={{ paper: { className: 'customer-browse-dialog browse-cart-drawer', style: revampCssVariables, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'browse-cart-title' } }}>
    <div className="browse-dialog-content"><button type="button" className="browse-dialog-close" onClick={onClose} aria-label="Close cart"><X size={20} /></button><h2 id="browse-cart-title">Your cart</h2>
      {items.length === 0 ? <p>Your cart is empty. Choose a dish from the menu.</p> : <>
        <ul className="browse-cart-list">{items.map(item => <li key={cartLineKey(item)}>{item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}<div className="browse-cart-line"><h3>{item.name}</h3>{item.variant && <p>{item.variant}</p>}{!!item.customizations?.length && <p>{item.customizations.join(', ')}</p>}{item.notes && <p>Note: {item.notes}</p>}<div className="browse-cart-controls"><div className="browse-quantity" role="group" aria-label={`Quantity for ${item.name}${item.variant ? ` ${item.variant}` : ''}`}><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => dispatch(updateItemQuantity({ id: cartLineKey(item), quantity: item.quantity - 1 }))}><Minus size={18} /></button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name}`} onClick={() => dispatch(updateItemQuantity({ id: cartLineKey(item), quantity: item.quantity + 1 }))}><Plus size={18} /></button></div><button type="button" className="browse-link-button" aria-label={`Remove ${item.name}`} onClick={() => dispatch(removeItemCompletely(cartLineKey(item)))}>Remove</button></div></div><strong>{formatMajorAmount(item.price * item.quantity, currency, locale)}</strong></li>)}</ul>
        <p className="browse-price-row"><span>Menu subtotal</span><strong>{formatMajorAmount(subtotal, currency, locale)}</strong></p><p>Delivery, discounts and final totals are confirmed at checkout.</p><button type="button" className="browse-primary browse-full" onClick={() => { onClose(); navigate('/checkout'); }}>Continue to checkout</button>
      </>}
    </div>
  </Drawer>;
}
