import React from 'react';
import { t } from '../manager-tokens';

export interface ManagerErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Error frame with optional retry — required reliability matrix state.
 */
export const ManagerErrorState: React.FC<ManagerErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load this data. Check your connection and try again.',
  onRetry,
  compact = false,
}) => (
  <div
    role="alert"
    style={{
      padding: compact ? '14px 12px' : '24px 20px',
      background: t.redLight,
      borderRadius: t.radius.lg,
      border: `1px solid ${t.red}33`,
      fontFamily: t.font,
    }}
  >
    <p style={{ margin: 0, fontSize: compact ? 13 : 14, fontWeight: 600, color: t.red }}>{title}</p>
    <p style={{ margin: '6px 0 0', fontSize: 13, color: t.gray, lineHeight: 1.4 }}>{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        style={{
          marginTop: 12,
          padding: '8px 14px',
          borderRadius: t.radius.sm,
          border: 'none',
          background: t.orange,
          color: t.white,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: t.font,
        }}
      >
        Retry
      </button>
    )}
  </div>
);

export default ManagerErrorState;
