import React from 'react';
import { t } from '../manager-tokens';

export interface ManagerEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

/**
 * Intentional empty frame — never a blank white panel.
 */
export const ManagerEmptyState: React.FC<ManagerEmptyStateProps> = ({
  title,
  description,
  action,
  compact = false,
}) => (
  <div
    role="status"
    style={{
      padding: compact ? '16px 12px' : '32px 20px',
      textAlign: 'center',
      background: t.white,
      borderRadius: t.radius.lg,
      border: `1px dashed ${t.grayLight}`,
      fontFamily: t.font,
    }}
  >
    <p style={{ margin: 0, fontSize: compact ? 13 : 15, fontWeight: 600, color: t.black }}>{title}</p>
    {description && (
      <p style={{ margin: '8px 0 0', fontSize: 13, color: t.gray, lineHeight: 1.45, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </p>
    )}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export default ManagerEmptyState;
