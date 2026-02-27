import type { Order, OrderItem, DeliveryAddress, QualityCheckpoint } from '../../store/api/orderApi';

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

const BASE_DATE = '2026-02-15T10:00:00Z';

const baseDeliveryAddress: DeliveryAddress = {
  street: '42 Curry Lane',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
  latitude: 17.385,
  longitude: 78.4867,
  landmark: 'Near Charminar',
};

const baseItems: OrderItem[] = [
  { menuItemId: 'item-1', name: 'Margherita Pizza', quantity: 2, price: 12.99 },
  { menuItemId: 'item-2', name: 'Garlic Bread', quantity: 1, price: 4.99 },
];

const baseOrder: Order = {
  id: 'order-1',
  orderNumber: 'ORD-20260215-001',
  customerId: 'cust-1',
  customerName: 'Test Customer',
  customerPhone: '555-0001',
  storeId: 'store-1',
  items: baseItems,
  subtotal: 30.97,
  deliveryFee: 5.0,
  tax: 3.1,
  total: 39.07,
  totalAmount: 39.07,
  status: 'RECEIVED',
  orderType: 'DELIVERY',
  paymentStatus: 'PENDING',
  priority: 'NORMAL',
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE,
};

// ---------------------------------------------------------------------------
// Order status variants
// ---------------------------------------------------------------------------

export const mockReceivedOrder: Order = { ...baseOrder };

export const mockPreparingOrder: Order = {
  ...baseOrder,
  id: 'order-2',
  orderNumber: 'ORD-20260215-002',
  status: 'PREPARING',
  paymentStatus: 'PAID',
  assignedKitchenStaffId: 'user-4',
  assignedKitchenStaffName: 'Test Kitchen',
  assignedToKitchenAt: '2026-02-15T10:05:00Z',
  updatedAt: '2026-02-15T10:05:00Z',
};

export const mockOvenOrder: Order = {
  ...baseOrder,
  id: 'order-3',
  orderNumber: 'ORD-20260215-003',
  status: 'OVEN',
  paymentStatus: 'PAID',
  updatedAt: '2026-02-15T10:10:00Z',
};

export const mockReadyOrder: Order = {
  ...baseOrder,
  id: 'order-4',
  orderNumber: 'ORD-20260215-004',
  status: 'READY',
  paymentStatus: 'PAID',
  preparationTime: 15,
  actualPreparationTime: 14,
  updatedAt: '2026-02-15T10:15:00Z',
};

export const mockDispatchedOrder: Order = {
  ...baseOrder,
  id: 'order-5',
  orderNumber: 'ORD-20260215-005',
  status: 'DISPATCHED',
  paymentStatus: 'PAID',
  assignedDriverId: 'user-3',
  driverId: 'user-3',
  driverName: 'Test Driver',
  estimatedDeliveryTime: '2026-02-15T10:45:00Z',
  updatedAt: '2026-02-15T10:20:00Z',
};

export const mockDeliveredOrder: Order = {
  ...baseOrder,
  id: 'order-6',
  orderNumber: 'ORD-20260215-006',
  status: 'DELIVERED',
  paymentStatus: 'PAID',
  assignedDriverId: 'user-3',
  driverId: 'user-3',
  driverName: 'Test Driver',
  completedAt: '2026-02-15T10:40:00Z',
  updatedAt: '2026-02-15T10:40:00Z',
};

export const mockCompletedOrder: Order = {
  ...baseOrder,
  id: 'order-7',
  orderNumber: 'ORD-20260215-007',
  status: 'COMPLETED',
  paymentStatus: 'PAID',
  completedAt: '2026-02-15T10:45:00Z',
  updatedAt: '2026-02-15T10:45:00Z',
};

export const mockCancelledOrder: Order = {
  ...baseOrder,
  id: 'order-8',
  orderNumber: 'ORD-20260215-008',
  status: 'CANCELLED',
  paymentStatus: 'REFUNDED',
  specialInstructions: 'Customer requested cancellation',
  updatedAt: '2026-02-15T10:10:00Z',
};

// ---------------------------------------------------------------------------
// Order type variants
// ---------------------------------------------------------------------------

export const mockOrderWithDelivery: Order = {
  ...baseOrder,
  id: 'order-9',
  orderNumber: 'ORD-20260215-009',
  deliveryAddress: baseDeliveryAddress,
};

export const mockOrderForPickup: Order = {
  ...baseOrder,
  id: 'order-10',
  orderNumber: 'ORD-20260215-010',
  orderType: 'TAKEAWAY',
  deliveryFee: 0,
  total: 34.07,
  totalAmount: 34.07,
};

export const mockOrderForDineIn: Order = {
  ...baseOrder,
  id: 'order-11',
  orderNumber: 'ORD-20260215-011',
  orderType: 'DINE_IN',
  status: 'SERVED',
  deliveryFee: 0,
  total: 34.07,
  totalAmount: 34.07,
};

// ---------------------------------------------------------------------------
// Special variants
// ---------------------------------------------------------------------------

export const mockUrgentOrder: Order = {
  ...baseOrder,
  id: 'order-12',
  orderNumber: 'ORD-20260215-012',
  priority: 'URGENT',
  specialInstructions: 'Rush order - customer waiting',
};

export const mockOrderWithQualityChecks: Order = {
  ...baseOrder,
  id: 'order-13',
  orderNumber: 'ORD-20260215-013',
  status: 'PREPARING',
  qualityCheckpoints: [
    {
      checkpointName: 'Ingredient Check',
      type: 'INGREDIENT_QUALITY',
      status: 'PASSED',
      checkedByStaffId: 'user-4',
      checkedByStaffName: 'Test Kitchen',
      checkedAt: '2026-02-15T10:06:00Z',
    },
    {
      checkpointName: 'Temperature Check',
      type: 'TEMPERATURE',
      status: 'PENDING',
    },
  ] satisfies QualityCheckpoint[],
};

export const mockOrderWithMakeTable: Order = {
  ...baseOrder,
  id: 'order-14',
  orderNumber: 'ORD-20260215-014',
  status: 'PREPARING',
  assignedMakeTableStation: 'Station A',
  assignedKitchenStaffId: 'user-4',
  assignedKitchenStaffName: 'Test Kitchen',
};

export const mockOrderCreatedByStaff: Order = {
  ...baseOrder,
  id: 'order-15',
  orderNumber: 'ORD-20260215-015',
  createdByStaffId: 'user-2',
  createdByStaffName: 'Test Manager',
};

// ---------------------------------------------------------------------------
// Order list (mixed statuses, types, and payment states)
// ---------------------------------------------------------------------------

export const mockOrderList: Order[] = [
  mockReceivedOrder,
  mockPreparingOrder,
  mockReadyOrder,
  mockDispatchedOrder,
  mockDeliveredOrder,
  mockCompletedOrder,
  mockCancelledOrder,
  mockOrderForPickup,
  mockOrderForDineIn,
  mockUrgentOrder,
];

// ---------------------------------------------------------------------------
// Kitchen queue subset (only active kitchen orders)
// ---------------------------------------------------------------------------

export const mockKitchenQueue: Order[] = [
  mockReceivedOrder,
  mockPreparingOrder,
  mockOvenOrder,
  mockReadyOrder,
];

// ---------------------------------------------------------------------------
// Delivery address helper
// ---------------------------------------------------------------------------

export { baseDeliveryAddress as mockDeliveryAddress };
