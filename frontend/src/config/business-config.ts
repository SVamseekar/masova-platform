/**
 * MaSoVa Restaurant Management System
 * Business Configuration
 *
 * Centralizes all business rules, fees, and operational parameters
 */

// ============================================
// PRICING & FEES
// ============================================

export const PRICING = {
  /**
   * Standard delivery fee in INR
   */
  DELIVERY_FEE: 40,

  /**
   * Tax rate as a percentage (e.g., 5 means 5%)
   */
  TAX_RATE: 5,

  /**
   * Minimum order value for delivery (INR)
   */
  MIN_ORDER_VALUE: 100,

  /**
   * Free delivery threshold (INR)
   */
  FREE_DELIVERY_THRESHOLD: 500,

  /**
   * Service charge percentage for dine-in orders
   */
  SERVICE_CHARGE_RATE: 0, // Currently disabled
} as const;

// ============================================
// ORDER MANAGEMENT
// ============================================

export const ORDER_SETTINGS = {
  /**
   * Default order type when not specified
   */
  DEFAULT_ORDER_TYPE: 'PICKUP' as const,

  /**
   * Estimated preparation time in minutes
   */
  ESTIMATED_PREP_TIME: {
    DINE_IN: 20,
    PICKUP: 15,
    DELIVERY: 25,
  },

  /**
   * Auto-cancel order if not accepted within (minutes)
   */
  AUTO_CANCEL_TIMEOUT: 15,

  /**
   * Maximum items per order
   */
  MAX_ITEMS_PER_ORDER: 50,
} as const;

// ============================================
// STORE OPERATIONS
// ============================================

export const STORE_HOURS = {
  /**
   * Default store opening time (24-hour format)
   */
  OPENING_TIME: '09:00',

  /**
   * Default store closing time (24-hour format)
   */
  CLOSING_TIME: '23:00',

  /**
   * Days of operation (0 = Sunday, 6 = Saturday)
   */
  OPERATING_DAYS: [0, 1, 2, 3, 4, 5, 6],
} as const;

// ============================================
// DRIVER SETTINGS
// ============================================

export const DRIVER_SETTINGS = {
  /**
   * Maximum delivery radius in kilometers
   */
  MAX_DELIVERY_RADIUS: 10,

  /**
   * Maximum concurrent deliveries per driver
   */
  MAX_CONCURRENT_DELIVERIES: 3,

  /**
   * Driver commission percentage
   */
  COMMISSION_RATE: 20,

  /**
   * GPS location update interval (milliseconds)
   */
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
} as const;

// ============================================
// PAYMENT SETTINGS
// ============================================

export const PAYMENT_SETTINGS = {
  /**
   * Supported payment methods
   */
  SUPPORTED_METHODS: [
    'CASH',
    'CARD',
    'UPI',
    'WALLET',
  ] as const,

  /**
   * Default payment method
   */
  DEFAULT_METHOD: 'CASH' as const,

  /**
   * Maximum cash payment amount (INR)
   */
  MAX_CASH_AMOUNT: 5000,
} as const;

// ============================================
// CURRENCY & FORMATTING
// ============================================

export const CURRENCY = {
  /**
   * Currency code
   */
  CODE: 'INR',

  /**
   * Currency symbol
   */
  SYMBOL: '₹',

  /**
   * Decimal places for currency display
   */
  DECIMAL_PLACES: 0, // Indian Rupee typically doesn't use decimals in restaurant context

  /**
   * Format a number as currency
   */
  format: (amount: number): string => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  },
} as const;

// ============================================
// MENU SETTINGS
// ============================================

export const MENU_SETTINGS = {
  /**
   * Maximum number of menu items to display per page
   */
  ITEMS_PER_PAGE: 12,

  /**
   * Show out-of-stock items
   */
  SHOW_OUT_OF_STOCK: true,

  /**
   * Default cuisine filter
   */
  DEFAULT_CUISINE: 'ALL',

  /**
   * Image placeholder URL
   */
  PLACEHOLDER_IMAGE: '/images/placeholder-food.jpg',
} as const;

// ============================================
// NOTIFICATION SETTINGS
// ============================================

export const NOTIFICATION_SETTINGS = {
  /**
   * Auto-dismiss notifications after (milliseconds)
   */
  AUTO_DISMISS_DURATION: 5000,

  /**
   * Sound alerts enabled by default
   */
  SOUND_ENABLED: true,

  /**
   * Vibration enabled by default (mobile)
   */
  VIBRATION_ENABLED: true,
} as const;

// ============================================
// SESSION MANAGEMENT
// ============================================

export const SESSION_SETTINGS = {
  /**
   * Minimum session duration in minutes
   */
  MIN_SESSION_DURATION: 30,

  /**
   * Warn user if session exceeds (hours)
   */
  SESSION_WARNING_THRESHOLD: 8,

  /**
   * Auto clock-out if inactive for (hours)
   */
  AUTO_CLOCK_OUT_THRESHOLD: 12,
} as const;

// ============================================
// UI SETTINGS
// ============================================

export const UI_SETTINGS = {
  /**
   * Toast notification position
   */
  TOAST_POSITION: 'top-right' as const,

  /**
   * Animation duration (milliseconds)
   */
  ANIMATION_DURATION: 300,

  /**
   * Debounce delay for search (milliseconds)
   */
  SEARCH_DEBOUNCE: 300,

  /**
   * Polling interval for real-time updates (milliseconds)
   */
  POLLING_INTERVAL: 5000, // 5 seconds
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  /**
   * Phone number regex (Indian format)
   */
  PHONE_REGEX: /^[6-9]\d{9}$/,

  /**
   * Minimum password length
   */
  MIN_PASSWORD_LENGTH: 6,

  /**
   * Maximum name length
   */
  MAX_NAME_LENGTH: 50,

  /**
   * Maximum address length
   */
  MAX_ADDRESS_LENGTH: 200,

  /**
   * Maximum special instructions length
   */
  MAX_INSTRUCTIONS_LENGTH: 500,
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  /**
   * Enable table management
   */
  TABLE_MANAGEMENT: false, // Coming in Phase 6

  /**
   * Enable loyalty program
   */
  LOYALTY_PROGRAM: false, // Coming in Phase 6

  /**
   * Enable online payments
   */
  ONLINE_PAYMENTS: false, // Coming in Phase 5

  /**
   * Enable ratings and reviews
   */
  RATINGS_REVIEWS: false, // Coming in Phase 6

  /**
   * Enable promotional banners
   */
  PROMOTIONAL_BANNERS: true,

  /**
   * Enable dark mode
   */
  DARK_MODE: false, // Coming in Phase 6
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate delivery fee based on order value
 */
export function calculateDeliveryFee(orderValue: number): number {
  if (orderValue >= PRICING.FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return PRICING.DELIVERY_FEE;
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number): number {
  return (subtotal * PRICING.TAX_RATE) / 100;
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  orderType: 'DINE_IN' | 'PICKUP' | 'DELIVERY'
): number {
  const tax = calculateTax(subtotal);
  const deliveryFee = orderType === 'DELIVERY' ? calculateDeliveryFee(subtotal) : 0;
  return subtotal + tax + deliveryFee;
}

/**
 * Check if order meets minimum value for delivery
 */
export function meetsMinimumOrderValue(orderValue: number): boolean {
  return orderValue >= PRICING.MIN_ORDER_VALUE;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  return VALIDATION.PHONE_REGEX.test(phone);
}
