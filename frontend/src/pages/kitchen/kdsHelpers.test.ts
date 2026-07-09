import { describe, it, expect } from 'vitest';
import {
  sortKitchenTickets,
  elapsedMinutes,
  formatElapsed,
  urgencyBand,
  nextKitchenStatus,
  terminalStatusForType,
  mapApiOrderType,
  computeQueueMetrics,
  ovenRemainingLabel,
  COOK_STATUSES,
  HANDOFF_STATUSES,
} from './kdsHelpers';

describe('kdsHelpers', () => {
  it('exposes 5 cook + 4 handoff columns', () => {
    expect(COOK_STATUSES).toHaveLength(5);
    expect(HANDOFF_STATUSES).toHaveLength(4);
  });

  it('sorts urgent before normal, then FIFO', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    const tickets = [
      {
        id: 'n',
        status: 'RECEIVED',
        priority: 'NORMAL' as const,
        receivedAt: new Date(now.getTime() - 10 * 60_000),
      },
      {
        id: 'u',
        status: 'RECEIVED',
        priority: 'URGENT' as const,
        receivedAt: new Date(now.getTime() - 2 * 60_000),
      },
      {
        id: 'n2',
        status: 'RECEIVED',
        priority: 'NORMAL' as const,
        receivedAt: new Date(now.getTime() - 5 * 60_000),
      },
    ];
    const sorted = sortKitchenTickets(tickets);
    expect(sorted.map((t) => t.id)).toEqual(['u', 'n', 'n2']);
  });

  it('computes elapsed minutes and formats hours', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    const past = new Date('2026-07-10T11:47:00Z');
    expect(elapsedMinutes(past, now)).toBe(13);
    expect(formatElapsed(13)).toBe('13m');
    expect(formatElapsed(75)).toBe('1h 15m');
  });

  it('maps urgency bands from real age', () => {
    expect(urgencyBand(2)).toBe('ok');
    expect(urgencyBand(5)).toBe('warn');
    expect(urgencyBand(10)).toBe('critical');
  });

  it('advances delivery through DISPATCHED and dine-in stops at READY', () => {
    expect(nextKitchenStatus('RECEIVED', 'DELIVERY')).toBe('PREPARING');
    expect(nextKitchenStatus('READY', 'DELIVERY')).toBe('DISPATCHED');
    expect(nextKitchenStatus('READY', 'DINE_IN')).toBeNull();
    expect(nextKitchenStatus('READY', 'COLLECTION')).toBeNull();
    expect(nextKitchenStatus('DISPATCHED', 'DELIVERY')).toBeNull();
  });

  it('terminal status depends on order type', () => {
    expect(terminalStatusForType('DINE_IN')).toBe('SERVED');
    expect(terminalStatusForType('COLLECTION')).toBe('COMPLETED');
    expect(terminalStatusForType('DELIVERY')).toBeNull();
  });

  it('maps TAKEAWAY to COLLECTION for KDS labels', () => {
    expect(mapApiOrderType('TAKEAWAY')).toBe('COLLECTION');
    expect(mapApiOrderType('DELIVERY')).toBe('DELIVERY');
  });

  it('computes queue metrics from active tickets only', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    const metrics = computeQueueMetrics(
      [
        {
          status: 'RECEIVED',
          priority: 'URGENT',
          receivedAt: new Date(now.getTime() - 6 * 60_000),
        },
        {
          status: 'PREPARING',
          priority: 'NORMAL',
          receivedAt: new Date(now.getTime() - 4 * 60_000),
        },
        {
          status: 'COMPLETED',
          priority: 'NORMAL',
          receivedAt: new Date(now.getTime() - 30 * 60_000),
        },
      ],
      now
    );
    expect(metrics.activeCount).toBe(2);
    expect(metrics.urgentCount).toBe(1);
    expect(metrics.newCount).toBe(1);
    expect(metrics.avgWaitMins).toBe(5);
    expect(metrics.maxWaitMins).toBe(6);
  });

  it('labels oven timer as estimate when no actual oven time', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    const started = new Date(now.getTime() - 3 * 60_000);
    const est = ovenRemainingLabel({
      status: 'OVEN',
      ovenStartedAt: started,
      now,
      estimateMinutes: 7,
    });
    expect(est).toEqual({ text: '4m left', isEstimate: true });

    const actual = ovenRemainingLabel({
      status: 'OVEN',
      actualOvenTime: 5,
      now,
    });
    expect(actual).toEqual({ text: '5m oven (actual)', isEstimate: false });

    expect(ovenRemainingLabel({ status: 'PREPARING', now })).toBeNull();
  });
});
