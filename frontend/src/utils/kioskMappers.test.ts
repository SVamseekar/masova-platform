import { describe, it, expect } from 'vitest';
import { mapKioskListResponse } from './kioskMappers';

describe('mapKioskListResponse', () => {
  it('maps UserResponse rows with terminalId field', () => {
    const rows = mapKioskListResponse([
      {
        id: 'k1',
        terminalId: 'POS-01',
        storeId: 'DOM001',
        isActive: true,
        name: 'Kiosk',
        email: 'kiosk@test',
        lastLogin: '2026-07-01T00:00:00',
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].terminalId).toBe('POS-01');
    expect(rows[0].lastKioskAccess).toBe('2026-07-01T00:00:00');
  });

  it('parses terminalId from seed email pattern', () => {
    const rows = mapKioskListResponse([
      {
        id: 'k2',
        storeId: 'DOM001',
        isActive: true,
        name: 'Kiosk POS-E2E-02 - Store DOM001',
        email: 'kiosk.DOM001.POS-E2E-02@masova.internal',
      },
    ]);
    expect(rows[0].terminalId).toBe('POS-E2E-02');
  });

  it('returns empty array for non-array payload', () => {
    expect(mapKioskListResponse(null)).toEqual([]);
    expect(mapKioskListResponse({})).toEqual([]);
  });
});
