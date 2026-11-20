import { useState, type ReactNode } from 'react';
import BrowseHeader from './BrowseHeader';
import BrowseCart from './BrowseCart';
import { revampCssVariables } from '../../../styles/design-tokens';
import './CustomerBrowse.css';

export default function BrowseShell({ children, onCartClick }: { children: ReactNode; onCartClick?: () => void }) {
  const [cartOpen, setCartOpen] = useState(false);
  return <div className="customer-browse" style={revampCssVariables}>
    <BrowseHeader onCartClick={onCartClick || (() => setCartOpen(true))} />
    {children}
    {!onCartClick && <BrowseCart open={cartOpen} onClose={() => setCartOpen(false)} />}
  </div>;
}
