export type OrderTypePreference = 'DELIVERY' | 'TAKEAWAY';

const KEY = 'masova.orderTypePreference';

/** Delivery or pickup chosen while browsing; checkout starts from it and can still change it. */
export function readOrderTypePreference(): OrderTypePreference {
  try {
    return sessionStorage.getItem(KEY) === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY';
  } catch {
    return 'DELIVERY';
  }
}

export function saveOrderTypePreference(value: OrderTypePreference) {
  try {
    sessionStorage.setItem(KEY, value);
  } catch (error) {
    console.warn('Order type preference could not be kept for this visit', error);
  }
}
