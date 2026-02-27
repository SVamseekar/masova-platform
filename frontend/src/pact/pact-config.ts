/**
 * Pact Configuration for MaSoVa Frontend
 * Consumer-Driven Contract Testing Setup
 *
 * Note: This file is used by test runners (Jest/Vitest) and should not be
 * compiled by the main application tsconfig.
 */

export const pactConfig = {
  consumer: 'masova-frontend',
  logLevel: 'info' as const,
  dir: './pacts',
  log: './logs/pact.log',
  pactfileWriteMode: 'update' as const,
  spec: 2,
};

export const providers = {
  orderService: {
    provider: 'order-service',
    port: 8545,
  },
  deliveryService: {
    provider: 'delivery-service',
    port: 8546,
  },
  paymentService: {
    provider: 'payment-service',
    port: 8547,
  },
  userService: {
    provider: 'user-service',
    port: 8548,
  },
  menuService: {
    provider: 'menu-service',
    port: 8549,
  },
  customerService: {
    provider: 'customer-service',
    port: 8550,
  },
  notificationService: {
    provider: 'notification-service',
    port: 8551,
  },
  analyticsService: {
    provider: 'analytics-service',
    port: 8552,
  },
  inventoryService: {
    provider: 'inventory-service',
    port: 8553,
  },
  reviewService: {
    provider: 'review-service',
    port: 8554,
  },
};

export default pactConfig;
