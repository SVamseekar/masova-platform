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
        padding: compact ? 14 : 20,
        marginBottom: compact ? 10 : 0,
      }}
      data-testid="manager-stat-card"
      data-loading={loading ? 'true' : 'false'}
      data-error={error ? 'true' : 'false'}
    >
      <p style={{ fontSize: 12, color: t.gray, margin: 0 }}>{label}</p>
      <p
        style={{
          fontSize: compact ? 20 : 24,
          fontWeight: 700,
          color: valueColor,
          margin: '4px 0 0 0',
          fontFamily: t.font,
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
