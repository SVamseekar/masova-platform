export interface User {
  id: string;
  type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER';
  name: string;
  email: string;
  phone: string;
  address?: Address;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  storeId?: string;
  role?: string;
  permissions?: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkingSession {
  id: string;
  employeeId: string;
  storeId: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  totalHours?: number;
  isActive: boolean;
  breakDurationMinutes: number;
  notes?: string;
  currentWorkingDuration?: string;
  name?: string;
  role?: string;
  breakTime?: number;
  status?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  storeId: string;
  orderType: 'DELIVERY' | 'COLLECTION';
  items: OrderItem[];
  status: 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'DISPATCHED' | 'DELIVERED';
  payment: {
    method: 'RAZORPAY' | 'CASH' | 'CARD';
    amountINR: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
  };
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export interface OrderItem {
  type: 'PIZZA' | 'SIDE' | 'DRINK' | 'DIP';
  name: string;
  size?: string;
  toppings: string[];
  quantity: number;
  priceINR: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

export interface CartItem extends MenuItem {
  cartId: number;
  quantity: number;
}
