import { describe, expect, it } from 'vitest';
import { normalizeTracking } from './deliveryApi';

describe('normalizeTracking', () => {
  it('flattens the delivery service response into the fields pages read', () => {
    const before = Date.now();
    const result = normalizeTracking({ orderId: 'o1', orderStatus: 'OUT_FOR_DELIVERY', driver: { driverName: 'Jonas K.' }, estimatedArrivalMinutes: 12, distanceRemainingKm: 2.5, lastUpdated: '2026-10-10T14:30:00' });
    expect(result).toMatchObject({ orderId: 'o1', status: 'OUT_FOR_DELIVERY', driverName: 'Jonas K.', distanceRemaining: 2500 });
    expect(result.driverPhone).toBeUndefined();
    const eta = new Date(result.estimatedArrival ?? '').getTime();
    expect(eta).toBeGreaterThanOrEqual(before + 12 * 60000);
    expect(eta).toBeLessThanOrEqual(Date.now() + 12 * 60000);
  });

  it('leaves the arrival time unset when the service has no estimate', () => {
    const result = normalizeTracking({ orderId: 'o1', orderStatus: 'DISPATCHED', driver: null, estimatedArrivalMinutes: null });
    expect(result.estimatedArrival).toBeUndefined();
    expect(result.driverName).toBeUndefined();
    expect(result.status).toBe('DISPATCHED');
  });
});
