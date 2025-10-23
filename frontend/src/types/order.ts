/**
 * Order Management Type Definitions
 * Aligned with backend Order entity and DTOs
 */

export type OrderStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'OVEN'
  | 'BAKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderType =
  | 'DINE_IN'
  | 'TAKEAWAY'
  | 'DELIVERY';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'WALLET';

export type OrderPriority =
  | 'NORMAL'
  | 'URGENT';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  customizations?: string[];
}

export interface DeliveryAddress {
  street: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentTransactionId?: string;
  priority: OrderPriority;
  preparationTime?: number;
  estimatedDeliveryTime?: string;
  deliveryAddress?: DeliveryAddress;
  assignedDriverId?: string;
  specialInstructions?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Kitchen workflow timestamps
  receivedAt?: string;
  preparingStartedAt?: string;
  ovenStartedAt?: string;
  bakedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface CreateOrderRequest {
  storeId: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    variant?: string;
    customizations?: string[];
  }>;
  orderType: OrderType;
  paymentMethod?: PaymentMethod;
  deliveryAddress?: DeliveryAddress;
  specialInstructions?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderItemsRequest {
  orderId: string;
  items: OrderItem[];
}

export interface AssignDriverRequest {
  orderId: string;
  driverId: string;
}

export interface UpdatePaymentRequest {
  orderId: string;
  status: PaymentStatus;
  transactionId?: string;
}

export interface UpdatePriorityRequest {
  orderId: string;
  priority: OrderPriority;
}

export interface CancelOrderRequest {
  orderId: string;
  reason?: string;
}

// UI Helper Types
export interface OrderFilters {
  storeId?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Status flow for kitchen workflow
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'RECEIVED',
  'PREPARING',
  'OVEN',
  'BAKED',
  'DISPATCHED',
  'DELIVERED'
];

// Helper to get next status in workflow
export const getNextOrderStatus = (currentStatus: OrderStatus): OrderStatus | null => {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_FLOW.length - 1) {
    return null;
  }
  return ORDER_STATUS_FLOW[currentIndex + 1];
};

// Status display configurations
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  RECEIVED: { label: 'Received', color: '#3b82f6', icon: '📋' },
  PREPARING: { label: 'Preparing', color: '#f59e0b', icon: '👨‍🍳' },
  OVEN: { label: 'In Oven', color: '#e53e3e', icon: '🔥' },
  BAKED: { label: 'Ready', color: '#10b981', icon: '✅' },
  DISPATCHED: { label: 'Dispatched', color: '#8b5cf6', icon: '🚚' },
  DELIVERED: { label: 'Delivered', color: '#059669', icon: '📦' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', icon: '❌' },
};

// Order type display configurations
export const ORDER_TYPE_CONFIG: Record<OrderType, { label: string; color: string; icon: string }> = {
  DELIVERY: { label: 'Delivery', color: '#3b82f6', icon: '🚚' },
  TAKEAWAY: { label: 'Takeaway', color: '#10b981', icon: '🏪' },
  DINE_IN: { label: 'Dine-In', color: '#f59e0b', icon: '🍽️' },
};

// Payment status display configurations
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
  PAID: { label: 'Paid', color: '#10b981', icon: '✅' },
  FAILED: { label: 'Failed', color: '#ef4444', icon: '❌' },
  REFUNDED: { label: 'Refunded', color: '#6b7280', icon: '↩️' },
};
