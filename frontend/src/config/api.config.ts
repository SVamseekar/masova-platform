/**
 * API Configuration
 * Central configuration for all API endpoints and settings
 *
 * IMPORTANT: All requests MUST go through API Gateway for security
 */

export const API_CONFIG = {
  // API Gateway - Single entry point for all backend services
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',

  // Base URL (alias for API Gateway)
  BASE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',

  // Service URLs through API Gateway
  USER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  ORDER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  PAYMENT_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  CUSTOMER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  REVIEW_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',

  // Service URLs (for reference only - DO NOT USE DIRECTLY)
  // All requests go through API Gateway
  _INTERNAL_SERVICES: {
    USER_SERVICE: 8081,
    MENU_SERVICE: 8082,
    ORDER_SERVICE: 8083,
    ANALYTICS_SERVICE: 8085,
    PAYMENT_SERVICE: 8086,
    INVENTORY_SERVICE: 8088,
    REVIEW_SERVICE: 8089,
    DELIVERY_SERVICE: 8090,
    CUSTOMER_SERVICE: 8091,
    NOTIFICATION_SERVICE: 8092,
  },

  // Timeouts
  TIMEOUT: 30000, // 30 seconds

  // WebSocket
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8083/ws',
} as const;

// Use API Gateway for all endpoints
const GATEWAY = API_CONFIG.API_GATEWAY_URL;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${GATEWAY}/auth/login`,
    REGISTER: `${GATEWAY}/auth/register`,
    REFRESH_TOKEN: `${GATEWAY}/auth/refresh`,
    LOGOUT: `${GATEWAY}/auth/logout`,
    PROFILE: `${GATEWAY}/users/profile`,
  },

  // Users
  USERS: {
    BASE: `${GATEWAY}/users`,
    BY_ID: (id: string) => `${GATEWAY}/users/${id}`,
    BY_ROLE: (role: string) => `${GATEWAY}/users/role/${role}`,
    BY_STORE: (storeId: string) => `${GATEWAY}/users/store/${storeId}`,
  },

  // Sessions (Working Hours)
  SESSIONS: {
    BASE: `${GATEWAY}/sessions`,
    START: `${GATEWAY}/sessions/start`,
    END: `${GATEWAY}/sessions/end`,
    BY_ID: (id: string) => `${GATEWAY}/sessions/${id}`,
    BY_EMPLOYEE: (employeeId: string) => `${GATEWAY}/sessions/employee/${employeeId}`,
    ACTIVE: (storeId: string) => `${GATEWAY}/sessions/store/${storeId}/active`,
    APPROVE: (id: string) => `${GATEWAY}/sessions/${id}/approve`,
  },

  // Orders
  ORDERS: {
    BASE: `${GATEWAY}/orders`,
    BY_ID: (id: string) => `${GATEWAY}/orders/${id}`,
  },

  // Menu
  MENU: {
    BASE: `${GATEWAY}/menu`,
    ITEMS: `${GATEWAY}/menu/items`,
  },

  // Payments
  PAYMENTS: {
    BASE: `${GATEWAY}/payments`,
  },

  // Analytics
  ANALYTICS: {
    BASE: `${GATEWAY}/analytics`,
    SALES: (storeId: string) => `${GATEWAY}/analytics/sales/${storeId}`,
  },

  // Inventory
  INVENTORY: {
    BASE: `${GATEWAY}/inventory`,
    SUPPLIERS: `${GATEWAY}/suppliers`,
    PURCHASE_ORDERS: `${GATEWAY}/purchase-orders`,
    WASTE: `${GATEWAY}/waste`,
  },

  // Reviews
  REVIEWS: {
    BASE: `${GATEWAY}/reviews`,
    PUBLIC: `${GATEWAY}/reviews/public`,
  },

  // Customers
  CUSTOMERS: {
    BASE: `${GATEWAY}/customers`,
  },

  // Delivery
  DELIVERY: {
    BASE: `${GATEWAY}/delivery`,
    DISPATCH: `${GATEWAY}/dispatch`,
    TRACKING: `${GATEWAY}/tracking`,
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: `${GATEWAY}/notifications`,
    CAMPAIGNS: `${GATEWAY}/campaigns`,
  },
} as const;

export default API_CONFIG;
