/**
 * API Configuration
 * Central configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  // Base URLs
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',

  // Service endpoints
  USER_SERVICE: '/api/users',
  ORDER_SERVICE: '/api/orders',
  MENU_SERVICE: '/api/menu',
  ANALYTICS_SERVICE: '/api/analytics',
  SESSION_SERVICE: '/api/sessions',

  // Timeouts
  TIMEOUT: 30000, // 30 seconds

  // WebSocket
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws',
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_CONFIG.USER_SERVICE}/login`,
    REGISTER: `${API_CONFIG.USER_SERVICE}/register`,
    REFRESH_TOKEN: `${API_CONFIG.USER_SERVICE}/refresh-token`,
    LOGOUT: `${API_CONFIG.USER_SERVICE}/logout`,
    PROFILE: `${API_CONFIG.USER_SERVICE}/profile`,
  },

  // Users
  USERS: {
    BASE: API_CONFIG.USER_SERVICE,
    BY_ID: (id: string) => `${API_CONFIG.USER_SERVICE}/${id}`,
    BY_ROLE: (role: string) => `${API_CONFIG.USER_SERVICE}/role/${role}`,
    BY_STORE: (storeId: string) => `${API_CONFIG.USER_SERVICE}/store/${storeId}`,
  },

  // Sessions (Working Hours)
  SESSIONS: {
    BASE: API_CONFIG.SESSION_SERVICE,
    START: `${API_CONFIG.SESSION_SERVICE}/start`,
    END: `${API_CONFIG.SESSION_SERVICE}/end`,
    BY_ID: (id: string) => `${API_CONFIG.SESSION_SERVICE}/${id}`,
    BY_EMPLOYEE: (employeeId: string) => `${API_CONFIG.SESSION_SERVICE}/employee/${employeeId}`,
    ACTIVE: (storeId: string) => `${API_CONFIG.SESSION_SERVICE}/store/${storeId}/active`,
    APPROVE: (id: string) => `${API_CONFIG.SESSION_SERVICE}/${id}/approve`,
  },

  // Analytics
  ANALYTICS: {
    SALES: (storeId: string) => `${API_CONFIG.ANALYTICS_SERVICE}/sales/${storeId}`,
  },
} as const;

export default API_CONFIG;
