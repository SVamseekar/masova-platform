import React from 'react';
import { ArrowUp, CircleCheck } from 'lucide-react';
import { t } from './manager-tokens';

export const SOURCES: Record<string, { label: string; color: string }> = {
  MASOVA: { label: 'Direct', color: '#203D32' },
  WOLT: { label: 'Wolt', color: '#0891B2' },
  DELIVEROO: { label: 'Deliveroo', color: '#2563EB' },
  JUST_EAT: { label: 'Just Eat', color: '#EA580C' },
  UBER_EATS: { label: 'Uber Eats', color: '#4F46E5' },
};

export const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Collection',
  DINE_IN: 'Dine in',
};

type BadgeIcon = 'up' | 'check' | null;

export const STATUS_BADGES: Record<string, { bg: string; color: string; icon: BadgeIcon }> = {
  PREPARING: { bg: '#FFE5DA', color: '#B8400A', icon: 'up' },
  OVEN: { bg: '#FFEFCC', color: '#8A5A0B', icon: 'up' },
  BAKED: { bg: '#ECECEA', color: '#55635A', icon: null },
  READY: { bg: '#DDF3E6', color: '#146342', icon: 'check' },
  RECEIVED: { bg: '#E8F1FC', color: '#17588B', icon: null },
  DISPATCHED: { bg: '#E8F1FC', color: '#17588B', icon: null },
  OUT_FOR_DELIVERY: { bg: '#E8F1FC', color: '#17588B', icon: null },
  DELIVERED: { bg: '#DDF3E6', color: '#146342', icon: 'check' },
  SERVED: { bg: '#DDF3E6', color: '#146342', icon: 'check' },
  COMPLETED: { bg: '#DDF3E6', color: '#146342', icon: 'check' },
  CANCELLED: { bg: '#FCE9E7', color: '#AA2424', icon: null },
};

export const STATUS_LABELS: Record<string, string> = {
  OVEN: 'In oven',
  OUT_FOR_DELIVERY: 'Out for delivery',
};

export const statusLabel = (status: string): string => {
  const key = status.toUpperCase();
  return STATUS_LABELS[key] || key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ');
};

export const SourceCell: React.FC<{ source: string | undefined }> = ({ source }) => {
  const info = SOURCES[source || 'MASOVA'] || { label: source || 'Direct', color: t.gray };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 18, height: 18, borderRadius: 5, background: info.color, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid #fff' }} />
      </span>
      {info.label}
    </span>
  );
};

export const StatusCell: React.FC<{ status: string; minWidth?: number }> = ({ status, minWidth = 128 }) => {
  const badge = STATUS_BADGES[status.toUpperCase()] || { bg: t.selection, color: t.gray, icon: null as BadgeIcon };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, minWidth, padding: '7px 12px', borderRadius: 8,
        background: badge.bg, color: badge.color, fontSize: 14, fontWeight: 500, boxSizing: 'border-box',
      }}
    >
      {badge.icon === 'up' && <ArrowUp size={15} strokeWidth={2} aria-hidden />}
      {badge.icon === 'check' && <CircleCheck size={15} strokeWidth={2} aria-hidden />}
      {statusLabel(status)}
    </span>
  );
};
