// scripts/seed-database.js
// Seeds all MaSoVa databases with realistic development data.
// Run with: node scripts/seed-database.js
//
// Order: stores → users → customers → orders → deliveries → payments → reviews
// Menu is seeded separately via: node scripts/seed-menu-all-stores.js

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// ─── STORES ───────────────────────────────────────────────────────────────────

const stores = [
  {
    _id: 'store-1', storeId: 'store-1', name: 'Downtown Branch', storeCode: 'DT-001',
    address: { street: '123 Main Street', city: 'Hyderabad', state: 'Telangana', pincode: '500001', landmark: 'Near Charminar', latitude: 17.385, longitude: 78.4867 },
    phoneNumber: '+91-40-2345-6789', email: 'downtown@masova.com',
    managerId: 'user-manager-1',
    operatingHours: {
      monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' }
    },
    status: 'ACTIVE', isActive: true, hasDelivery: true, deliveryRadius: 10,
    createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  },
  {
    _id: 'store-2', storeId: 'store-2', name: 'HITEC City Branch', storeCode: 'HC-002',
    address: { street: '456 Tech Park Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081', landmark: 'Near HITEC City Metro', latitude: 17.4435, longitude: 78.3772 },
    phoneNumber: '+91-40-3456-7890', email: 'hitec@masova.com',
    managerId: 'user-manager-2',
    operatingHours: {
      monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' }
    },
    status: 'ACTIVE', isActive: true, hasDelivery: true, deliveryRadius: 8,
    createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01')
  },
  {
    _id: 'store-3', storeId: 'store-3', name: 'Secunderabad Branch', storeCode: 'SC-003',
    address: { street: '789 Station Road', city: 'Secunderabad', state: 'Telangana', pincode: '500003', latitude: 17.4399, longitude: 78.4983 },
    phoneNumber: '+91-40-4567-8901', email: 'secunderabad@masova.com',
    managerId: 'user-manager-3',
    operatingHours: {
      monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' }
    },
    status: 'TEMPORARILY_CLOSED', isActive: false, hasDelivery: false, deliveryRadius: 5,
    createdAt: new Date('2025-03-01'), updatedAt: new Date('2026-02-10')
  }
];

// ─── USERS ────────────────────────────────────────────────────────────────────
// passwordHash is a bcrypt placeholder — not usable for real login.
// For dev login use the running system's register endpoint or replace with real hashes.

const PLACEHOLDER_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y'; // "password123"

const users = [
  // Managers
  { _id: 'user-manager-1', userId: 'user-manager-1', email: 'suresh.manager@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Suresh', lastName: 'Kumar', phoneNumber: '+91-98765-11001', type: 'MANAGER', role: 'MANAGER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-manager-2', userId: 'user-manager-2', email: 'priya.manager@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Priya', lastName: 'Sharma', phoneNumber: '+91-98765-11002', type: 'MANAGER', role: 'MANAGER', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  { _id: 'user-manager-3', userId: 'user-manager-3', email: 'anand.manager@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Anand', lastName: 'Reddy', phoneNumber: '+91-98765-11003', type: 'MANAGER', role: 'MANAGER', storeId: 'store-3', isActive: true, emailVerified: true, createdAt: new Date('2025-03-01'), updatedAt: new Date('2025-03-01') },
  // Kitchen staff
  { _id: 'user-staff-1', userId: 'user-staff-1', email: 'rahul.staff@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Rahul', lastName: 'Singh', phoneNumber: '+91-98765-11004', type: 'STAFF', role: 'KITCHEN_STAFF', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-staff-2', userId: 'user-staff-2', email: 'meena.staff@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Meena', lastName: 'Pillai', phoneNumber: '+91-98765-11005', type: 'STAFF', role: 'KITCHEN_STAFF', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-staff-3', userId: 'user-staff-3', email: 'vijay.staff@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Vijay', lastName: 'Nair', phoneNumber: '+91-98765-11006', type: 'STAFF', role: 'KITCHEN_STAFF', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-06-01') },
  // Drivers
  { _id: 'user-driver-1', userId: 'user-driver-1', email: 'ravi.driver@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Ravi', lastName: 'Yadav', phoneNumber: '+91-98765-11007', type: 'DRIVER', role: 'DRIVER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-driver-2', userId: 'user-driver-2', email: 'sanjay.driver@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Sanjay', lastName: 'Verma', phoneNumber: '+91-98765-11008', type: 'DRIVER', role: 'DRIVER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-driver-3', userId: 'user-driver-3', email: 'kiran.driver@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Kiran', lastName: 'Babu', phoneNumber: '+91-98765-11009', type: 'DRIVER', role: 'DRIVER', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  // Kiosk terminal account
  { _id: 'user-kiosk-1', userId: 'user-kiosk-1', email: 'kiosk.pos@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'POS', lastName: 'Terminal', phoneNumber: '+91-98765-11010', type: 'KIOSK', role: 'KIOSK', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  // Assistant manager
  { _id: 'user-asst-1', userId: 'user-asst-1', email: 'rohan.asst@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Rohan', lastName: 'Das', phoneNumber: '+91-98765-11011', type: 'ASSISTANT_MANAGER', role: 'ASSISTANT_MANAGER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  // Admin
  { _id: 'user-admin-1', userId: 'user-admin-1', email: 'admin@masova.com', passwordHash: PLACEHOLDER_HASH, firstName: 'Admin', lastName: 'MaSoVa', phoneNumber: '+91-98765-11012', type: 'MANAGER', role: 'ADMIN', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') }
];

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

const customers = [
  {
    _id: 'cust-1', customerId: 'cust-1', name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phoneNumber: '+91-98765-20001',
    addresses: [{ addressId: 'addr-1', label: 'HOME', street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.4867, isDefault: true }],
    loyaltyPoints: 1250, tier: 'SILVER', totalOrders: 18, totalSpent: 12400, averageOrderValue: 689, lastOrderDate: new Date('2026-02-14'),
    isActive: true, createdAt: new Date('2025-03-15'), updatedAt: new Date('2026-02-14')
  },
  {
    _id: 'cust-2', customerId: 'cust-2', name: 'Lakshmi Narayan', email: 'lakshmi.n@gmail.com', phoneNumber: '+91-98765-20002',
    addresses: [{ addressId: 'addr-2', label: 'HOME', street: '88 Tech Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4435, longitude: 78.3772, isDefault: true }],
    loyaltyPoints: 4800, tier: 'GOLD', totalOrders: 52, totalSpent: 38500, averageOrderValue: 740, lastOrderDate: new Date('2026-02-15'),
    isActive: true, createdAt: new Date('2025-01-10'), updatedAt: new Date('2026-02-15')
  },
  {
    _id: 'cust-3', customerId: 'cust-3', name: 'Deepa Krishnan', email: 'deepa.k@gmail.com', phoneNumber: '+91-98765-20003',
    addresses: [{ addressId: 'addr-3', label: 'WORK', street: '15 IT Park', city: 'Hyderabad', state: 'Telangana', pincode: '500032', latitude: 17.4239, longitude: 78.4738, isDefault: true }],
    loyaltyPoints: 320, tier: 'BRONZE', totalOrders: 5, totalSpent: 3100, averageOrderValue: 620, lastOrderDate: new Date('2026-02-10'),
    isActive: true, createdAt: new Date('2026-01-05'), updatedAt: new Date('2026-02-10')
  },
  {
    _id: 'cust-4', customerId: 'cust-4', name: 'Venkat Rao', email: 'venkat.rao@gmail.com', phoneNumber: '+91-98765-20004',
    addresses: [{ addressId: 'addr-4', label: 'HOME', street: '7 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.4318, longitude: 78.4071, isDefault: true }],
    loyaltyPoints: 12000, tier: 'PLATINUM', totalOrders: 140, totalSpent: 98000, averageOrderValue: 700, lastOrderDate: new Date('2026-02-16'),
    isActive: true, createdAt: new Date('2024-11-01'), updatedAt: new Date('2026-02-16')
  },
  {
    _id: 'cust-5', customerId: 'cust-5', name: 'Sunita Patel', email: 'sunita.p@gmail.com', phoneNumber: '+91-98765-20005',
    addresses: [],
    loyaltyPoints: 80, tier: 'BRONZE', totalOrders: 2, totalSpent: 850, averageOrderValue: 425, lastOrderDate: new Date('2026-02-01'),
    isActive: true, createdAt: new Date('2026-01-28'), updatedAt: new Date('2026-02-01')
  }
];

// ─── ORDERS ───────────────────────────────────────────────────────────────────

const baseItems = [
  { menuItemId: 'item-pizza-1', name: 'Margherita Pizza', quantity: 2, unitPrice: 29900, subtotal: 59800, notes: '' },
  { menuItemId: 'item-sides-1', name: 'Garlic Bread', quantity: 1, unitPrice: 9900, subtotal: 9900, notes: '' }
];

const orders = [
  { _id: 'order-1', orderId: 'order-1', orderNumber: 'ORD-20260215-001', customerId: 'cust-1', customerName: 'Arjun Mehta', customerPhone: '+91-98765-20001', storeId: 'store-1', orderType: 'DELIVERY', items: baseItems, subtotal: 69700, taxAmount: 3485, taxPercentage: 5, deliveryFee: 4000, discountAmount: 0, totalAmount: 77185, status: 'RECEIVED', paymentStatus: 'PENDING', paymentMethod: 'UPI', deliveryAddress: { street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.4867 }, estimatedPreparationTime: 20, createdBy: 'user-staff-1', createdAt: new Date('2026-02-15T10:00:00Z'), updatedAt: new Date('2026-02-15T10:00:00Z') },
  { _id: 'order-2', orderId: 'order-2', orderNumber: 'ORD-20260215-002', customerId: 'cust-2', customerName: 'Lakshmi Narayan', customerPhone: '+91-98765-20002', storeId: 'store-1', orderType: 'DELIVERY', items: baseItems, subtotal: 69700, taxAmount: 3485, taxPercentage: 5, deliveryFee: 4000, discountAmount: 0, totalAmount: 77185, status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'CARD', deliveryAddress: { street: '88 Tech Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4435, longitude: 78.3772 }, estimatedPreparationTime: 20, assignedKitchenStaffId: 'user-staff-1', createdBy: 'user-staff-1', createdAt: new Date('2026-02-15T10:05:00Z'), updatedAt: new Date('2026-02-15T10:08:00Z') },
  { _id: 'order-3', orderId: 'order-3', orderNumber: 'ORD-20260215-003', customerId: 'cust-3', customerName: 'Deepa Krishnan', customerPhone: '+91-98765-20003', storeId: 'store-1', orderType: 'PICKUP', items: [{ menuItemId: 'item-biryani-1', name: 'Chicken Biryani', quantity: 1, unitPrice: 24900, subtotal: 24900 }], subtotal: 24900, taxAmount: 1245, taxPercentage: 5, deliveryFee: 0, discountAmount: 0, totalAmount: 26145, status: 'READY', paymentStatus: 'PAID', paymentMethod: 'CASH', estimatedPreparationTime: 25, actualPreparationTime: 22, createdBy: 'user-staff-2', createdAt: new Date('2026-02-15T10:10:00Z'), updatedAt: new Date('2026-02-15T10:32:00Z'), readyAt: new Date('2026-02-15T10:32:00Z') },
  { _id: 'order-4', orderId: 'order-4', orderNumber: 'ORD-20260215-004', customerId: 'cust-4', customerName: 'Venkat Rao', customerPhone: '+91-98765-20004', storeId: 'store-1', orderType: 'DELIVERY', items: baseItems, subtotal: 69700, taxAmount: 3485, taxPercentage: 5, deliveryFee: 4000, discountAmount: 0, totalAmount: 77185, status: 'DISPATCHED', paymentStatus: 'PAID', paymentMethod: 'UPI', deliveryAddress: { street: '7 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.4318, longitude: 78.4071 }, estimatedPreparationTime: 20, deliveryId: 'del-1', createdBy: 'user-staff-1', createdAt: new Date('2026-02-15T09:40:00Z'), updatedAt: new Date('2026-02-15T10:15:00Z') },
  { _id: 'order-5', orderId: 'order-5', orderNumber: 'ORD-20260214-001', customerId: 'cust-1', customerName: 'Arjun Mehta', customerPhone: '+91-98765-20001', storeId: 'store-1', orderType: 'DELIVERY', items: baseItems, subtotal: 69700, taxAmount: 3485, taxPercentage: 5, deliveryFee: 4000, discountAmount: 0, totalAmount: 77185, status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'UPI', deliveryAddress: { street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.4867 }, actualPreparationTime: 18, deliveryId: 'del-2', createdBy: 'user-staff-2', createdAt: new Date('2026-02-14T18:00:00Z'), updatedAt: new Date('2026-02-14T19:05:00Z'), deliveredAt: new Date('2026-02-14T19:05:00Z') },
  { _id: 'order-6', orderId: 'order-6', orderNumber: 'ORD-20260214-002', customerId: 'cust-5', customerName: 'Sunita Patel', customerPhone: '+91-98765-20005', storeId: 'store-2', orderType: 'PICKUP', items: [{ menuItemId: 'item-dosa-1', name: 'Masala Dosa', quantity: 2, unitPrice: 14900, subtotal: 29800 }], subtotal: 29800, taxAmount: 1490, taxPercentage: 5, deliveryFee: 0, discountAmount: 2980, totalAmount: 28310, status: 'CANCELLED', paymentStatus: 'REFUNDED', paymentMethod: 'UPI', cancellationReason: 'Customer requested cancellation', createdBy: 'user-staff-3', createdAt: new Date('2026-02-14T12:00:00Z'), updatedAt: new Date('2026-02-14T12:10:00Z'), cancelledAt: new Date('2026-02-14T12:10:00Z') },
  { _id: 'order-7', orderId: 'order-7', orderNumber: 'ORD-20260215-005', customerId: 'cust-2', customerName: 'Lakshmi Narayan', customerPhone: '+91-98765-20002', storeId: 'store-1', orderType: 'DELIVERY', items: [{ menuItemId: 'item-pizza-2', name: 'Paneer Pizza', quantity: 1, unitPrice: 34900, subtotal: 34900 }, { menuItemId: 'item-beverage-1', name: 'Cold Coffee', quantity: 2, unitPrice: 8900, subtotal: 17800 }], subtotal: 52700, taxAmount: 2635, taxPercentage: 5, deliveryFee: 4000, discountAmount: 0, totalAmount: 59335, status: 'OVEN', paymentStatus: 'PAID', paymentMethod: 'CARD', deliveryAddress: { street: '88 Tech Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4435, longitude: 78.3772 }, assignedKitchenStaffId: 'user-staff-2', createdBy: 'user-staff-2', createdAt: new Date('2026-02-15T10:15:00Z'), updatedAt: new Date('2026-02-15T10:22:00Z') },
  { _id: 'order-8', orderId: 'order-8', orderNumber: 'ORD-20260215-006', customerId: 'cust-4', customerName: 'Venkat Rao', customerPhone: '+91-98765-20004', storeId: 'store-1', orderType: 'PICKUP', items: [{ menuItemId: 'item-curry-1', name: 'Butter Chicken Curry', quantity: 2, unitPrice: 27900, subtotal: 55800 }, { menuItemId: 'item-naan-1', name: 'Garlic Naan', quantity: 4, unitPrice: 5900, subtotal: 23600 }], subtotal: 79400, taxAmount: 3970, taxPercentage: 5, deliveryFee: 0, discountAmount: 7940, totalAmount: 75430, status: 'BAKED', paymentStatus: 'PAID', paymentMethod: 'CASH', createdBy: 'user-staff-1', createdAt: new Date('2026-02-15T10:20:00Z'), updatedAt: new Date('2026-02-15T10:35:00Z') }
];

// ─── DELIVERIES ───────────────────────────────────────────────────────────────

const deliveries = [
  {
    _id: 'del-1', deliveryId: 'del-1', orderId: 'order-4', storeId: 'store-1', customerId: 'cust-4', driverId: 'user-driver-1',
    pickupAddress: { street: '123 Main Street', city: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
    deliveryAddress: { street: '7 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.4318, longitude: 78.4071 },
    distance: 4.2, estimatedTime: 25, status: 'IN_TRANSIT', priority: 'NORMAL', deliveryFee: 4000,
    trackingUpdates: [
      { timestamp: new Date('2026-02-15T10:15:00Z'), location: { latitude: 17.385, longitude: 78.4867 }, status: 'PICKED_UP', notes: 'Order picked up from store' },
      { timestamp: new Date('2026-02-15T10:25:00Z'), location: { latitude: 17.412, longitude: 78.453 }, status: 'IN_TRANSIT', notes: 'En route to customer' }
    ],
    assignedAt: new Date('2026-02-15T10:10:00Z'), pickedUpAt: new Date('2026-02-15T10:15:00Z'),
    createdAt: new Date('2026-02-15T10:05:00Z'), updatedAt: new Date('2026-02-15T10:25:00Z')
  },
  {
    _id: 'del-2', deliveryId: 'del-2', orderId: 'order-5', storeId: 'store-1', customerId: 'cust-1', driverId: 'user-driver-2',
    pickupAddress: { street: '123 Main Street', city: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
    deliveryAddress: { street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.4867 },
    distance: 2.1, estimatedTime: 20, actualTime: 20, status: 'DELIVERED', priority: 'NORMAL', deliveryFee: 4000,
    trackingUpdates: [
      { timestamp: new Date('2026-02-14T18:30:00Z'), location: { latitude: 17.385, longitude: 78.4867 }, status: 'PICKED_UP' },
      { timestamp: new Date('2026-02-14T19:05:00Z'), location: { latitude: 17.385, longitude: 78.4867 }, status: 'DELIVERED' }
    ],
    assignedAt: new Date('2026-02-14T18:20:00Z'), pickedUpAt: new Date('2026-02-14T18:30:00Z'), deliveredAt: new Date('2026-02-14T19:05:00Z'),
    createdAt: new Date('2026-02-14T18:15:00Z'), updatedAt: new Date('2026-02-14T19:05:00Z')
  }
];

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

const payments = [
  { _id: 'pay-1', paymentId: 'pay-1', orderId: 'order-2', customerId: 'cust-2', amount: 77185, currency: 'INR', paymentMethod: 'CARD', paymentGateway: 'RAZORPAY', transactionId: 'rpay_pay_abc001', status: 'SUCCESS', createdAt: new Date('2026-02-15T10:06:00Z'), updatedAt: new Date('2026-02-15T10:06:00Z'), paidAt: new Date('2026-02-15T10:06:00Z') },
  { _id: 'pay-2', paymentId: 'pay-2', orderId: 'order-3', customerId: 'cust-3', amount: 26145, currency: 'INR', paymentMethod: 'CASH', status: 'SUCCESS', createdAt: new Date('2026-02-15T10:11:00Z'), updatedAt: new Date('2026-02-15T10:11:00Z'), paidAt: new Date('2026-02-15T10:11:00Z') },
  { _id: 'pay-3', paymentId: 'pay-3', orderId: 'order-4', customerId: 'cust-4', amount: 77185, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_pay_abc002', status: 'SUCCESS', createdAt: new Date('2026-02-15T09:41:00Z'), updatedAt: new Date('2026-02-15T09:41:00Z'), paidAt: new Date('2026-02-15T09:41:00Z') },
  { _id: 'pay-4', paymentId: 'pay-4', orderId: 'order-5', customerId: 'cust-1', amount: 77185, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_pay_abc003', status: 'SUCCESS', createdAt: new Date('2026-02-14T18:01:00Z'), updatedAt: new Date('2026-02-14T18:01:00Z'), paidAt: new Date('2026-02-14T18:01:00Z') },
  { _id: 'pay-5', paymentId: 'pay-5', orderId: 'order-6', customerId: 'cust-5', amount: 28310, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_pay_abc004', status: 'REFUNDED', refundId: 'ref-1', createdAt: new Date('2026-02-14T12:01:00Z'), updatedAt: new Date('2026-02-14T12:12:00Z'), paidAt: new Date('2026-02-14T12:01:00Z') },
  { _id: 'pay-6', paymentId: 'pay-6', orderId: 'order-7', customerId: 'cust-2', amount: 59335, currency: 'INR', paymentMethod: 'CARD', paymentGateway: 'RAZORPAY', transactionId: 'rpay_pay_abc005', status: 'SUCCESS', createdAt: new Date('2026-02-15T10:16:00Z'), updatedAt: new Date('2026-02-15T10:16:00Z'), paidAt: new Date('2026-02-15T10:16:00Z') },
  { _id: 'pay-7', paymentId: 'pay-7', orderId: 'order-8', customerId: 'cust-4', amount: 75430, currency: 'INR', paymentMethod: 'CASH', status: 'SUCCESS', createdAt: new Date('2026-02-15T10:21:00Z'), updatedAt: new Date('2026-02-15T10:21:00Z'), paidAt: new Date('2026-02-15T10:21:00Z') },
  // Pending payment for order-1
  { _id: 'pay-8', paymentId: 'pay-8', orderId: 'order-1', customerId: 'cust-1', amount: 77185, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_order_pending001', status: 'PENDING', createdAt: new Date('2026-02-15T10:00:00Z'), updatedAt: new Date('2026-02-15T10:00:00Z') }
];

const refunds = [
  { _id: 'ref-1', refundId: 'ref-1', paymentId: 'pay-5', orderId: 'order-6', amount: 28310, reason: 'Customer requested cancellation', status: 'PROCESSED', processedBy: 'user-manager-2', transactionId: 'rpay_refund_001', createdAt: new Date('2026-02-14T12:12:00Z'), processedAt: new Date('2026-02-14T12:12:00Z') }
];

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

const reviews = [
  { _id: 'rev-1', reviewId: 'rev-1', orderId: 'order-5', customerId: 'cust-1', customerName: 'Arjun Mehta', storeId: 'store-1', rating: 5, foodRating: 5, serviceRating: 5, deliveryRating: 4, comment: 'Amazing pizza! Fast delivery too.', status: 'APPROVED', isPublic: true, createdAt: new Date('2026-02-14T20:00:00Z'), updatedAt: new Date('2026-02-14T21:00:00Z') },
  { _id: 'rev-2', reviewId: 'rev-2', orderId: 'order-4', customerId: 'cust-4', customerName: 'Venkat Rao', storeId: 'store-1', rating: 4, foodRating: 5, serviceRating: 4, deliveryRating: 4, comment: 'Great food, delivery was slightly late but worth it.', status: 'APPROVED', isPublic: true, response: { text: 'Thank you for your feedback! We are working on improving delivery times.', respondedBy: 'user-manager-1', respondedAt: new Date('2026-02-15T09:00:00Z') }, createdAt: new Date('2026-02-15T08:00:00Z'), updatedAt: new Date('2026-02-15T09:00:00Z') },
  { _id: 'rev-3', reviewId: 'rev-3', orderId: 'order-3', customerId: 'cust-3', customerName: 'Deepa Krishnan', storeId: 'store-1', rating: 3, foodRating: 3, serviceRating: 4, comment: 'Biryani was okay, expected more spice.', status: 'PENDING', isPublic: false, createdAt: new Date('2026-02-15T11:00:00Z'), updatedAt: new Date('2026-02-15T11:00:00Z') },
  { _id: 'rev-4', reviewId: 'rev-4', orderId: 'order-2', customerId: 'cust-2', customerName: 'Lakshmi Narayan', storeId: 'store-1', rating: 5, foodRating: 5, serviceRating: 5, comment: 'Best Margherita pizza in Hyderabad!', status: 'APPROVED', isPublic: true, createdAt: new Date('2026-02-15T09:30:00Z'), updatedAt: new Date('2026-02-15T10:00:00Z') },
  { _id: 'rev-5', reviewId: 'rev-5', orderId: 'order-7', customerId: 'cust-2', customerName: 'Lakshmi Narayan', storeId: 'store-1', rating: 4, foodRating: 4, serviceRating: 5, deliveryRating: 5, comment: 'Cold coffee was excellent. Quick delivery!', status: 'APPROVED', isPublic: true, createdAt: new Date('2026-02-15T10:00:00Z'), updatedAt: new Date('2026-02-15T10:00:00Z') }
];

// ─── SEED RUNNER ──────────────────────────────────────────────────────────────

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);

    const upsertAll = async (db, collection, docs) => {
      const col = client.db(db).collection(collection);
      let inserted = 0, updated = 0;
      for (const doc of docs) {
        const result = await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
        if (result.upsertedCount) inserted++;
        else updated++;
      }
      console.log(`  ${db}.${collection}: ${inserted} inserted, ${updated} updated`);
    };

    console.log('\n── Seeding stores (masova_db) ──');
    await upsertAll('masova_db', 'stores', stores);

    console.log('\n── Seeding users (masova_db) ──');
    await upsertAll('masova_db', 'users', users);

    console.log('\n── Seeding customers (masova_customers) ──');
    await upsertAll('masova_customers', 'customers', customers);

    console.log('\n── Seeding orders (masova_orders) ──');
    await upsertAll('masova_orders', 'orders', orders);

    console.log('\n── Seeding deliveries (masova_delivery) ──');
    await upsertAll('masova_delivery', 'deliveries', deliveries);

    console.log('\n── Seeding payments (masova_payments) ──');
    await upsertAll('masova_payments', 'payments', payments);
    await upsertAll('masova_payments', 'refunds', refunds);

    console.log('\n── Seeding reviews (masova_reviews) ──');
    await upsertAll('masova_reviews', 'reviews', reviews);

    console.log('\n✓ Seed complete.');
    console.log('  Note: Menu items are seeded separately → node scripts/seed-menu-all-stores.js');
    console.log('  Note: passwordHash values are placeholders — use real bcrypt hashes for auth testing.');

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
