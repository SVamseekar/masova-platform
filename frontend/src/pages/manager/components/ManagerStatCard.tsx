import React from 'react';
import { t, cardStyle } from '../manager-tokens';

export interface ManagerStatCardProps {
  label: string;
  value: string | number;
  /** Accent for the value (defaults to black). */
  color?: string;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  hint?: string;
  compact?: boolean;
}

/**
 * KPI / Quick Info stat tile with loading | error | data.
 * Never shows bare "--" without an explanation when error is set.
 */
export const ManagerStatCard: React.FC<ManagerStatCardProps> = ({
  label,
  value,
  color,
  loading = false,
  error = false,
  errorMessage = 'Could not load',
  hint,
  compact = false,
}) => {
  const display = loading ? '…' : error ? '—' : value;
  const valueColor = error ? t.red : (color || t.black);

  return (
    <div
      style={{
        ...cardStyle,
        padding: compact ? 12 : 14,
        marginBottom: compact ? 8 : 0,
        minWidth: 0,
        overflow: 'hidden',
      }}
      data-testid="manager-stat-card"
      data-loading={loading ? 'true' : 'false'}
      data-error={error ? 'true' : 'false'}
    >
      <p style={{ fontSize: 11, color: t.gray, margin: 0, letterSpacing: '0.01em' }}>{label}</p>
      <p
        style={{
          fontSize: compact ? 15 : 16,
          fontWeight: 700,
          color: valueColor,
          margin: '6px 0 0 0',
          fontFamily: t.font,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {display}
      </p>
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: t.red }}>{errorMessage}</p>
      )}
      {!error && !loading && hint && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: t.grayMuted }}>{hint}</p>
      )}
    </div>
  );
};

export default ManagerStatCard;
