import { NavLink } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import MaSoVaBrand from '../../../components/common/MaSoVaBrand';
import { useAppSelector } from '../../../store/hooks';
import { selectCartItemCount } from '../../../store/slices/cartSlice';
import CustomerStoreSelector from './CustomerStoreSelector';

export default function BrowseHeader({ onCartClick }: { onCartClick: () => void }) {
  const count = useAppSelector(selectCartItemCount);
  const authenticated = useAppSelector(state => state.auth.isAuthenticated && state.auth.user?.type === 'CUSTOMER');
  const activeOrderId = sessionStorage.getItem('activeOrderId');
  return <header className="browse-header">
    <NavLink to="/order" className="browse-brand" aria-label="MaSoVa ordering home"><MaSoVaBrand /></NavLink>
    <CustomerStoreSelector />
    <nav aria-label="Customer navigation">
      <NavLink to="/menu">Menu</NavLink><NavLink to="/promotions">Offers</NavLink>
      {/* Guests have no order history, so their only order link is the active order. */}
      {authenticated ? <NavLink to="/customer/orders">Orders</NavLink> : activeOrderId ? <NavLink to={`/tracking/${encodeURIComponent(activeOrderId)}`}>Orders</NavLink> : <NavLink to="/customer-login" state={{ from: '/customer/orders' }} className={() => ''}>Orders</NavLink>}
      <NavLink to={authenticated ? '/customer/profile' : '/customer-login'}>Account</NavLink>
    </nav>
    <NavLink to="/menu" className="browse-header-search" aria-label="Search the menu"><Search size={20} aria-hidden="true" /></NavLink>
    <button type="button" className="browse-primary browse-cart-button" onClick={onCartClick} aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}><ShoppingCart size={20} aria-hidden="true" /><span>{count}</span></button>
  </header>;
}
