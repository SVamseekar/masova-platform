import type { AllergenType } from '../../constants/allergens';
import type { Order } from '../../store/api/orderApi';
import type { MenuItem } from '../../store/api/menuApi';

export interface POSOrderItem {
  menuItemId: string;
  id?: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
  image?: string;
  variant?: string;
  customizations?: string[];
  allergens?: AllergenType[];
}

export interface POSCustomer {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export type POSOrderType = 'PICKUP' | 'DELIVERY' | 'DINE_IN';

export type POSOrder = Order;

export type { MenuItem };