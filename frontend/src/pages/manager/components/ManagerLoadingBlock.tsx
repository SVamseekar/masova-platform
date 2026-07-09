import React from 'react';
import { t, cardStyle } from '../manager-tokens';

export interface ManagerLoadingBlockProps {
  rows?: number;
  label?: string;
  compact?: boolean;
}

/**
 * Lightweight skeleton for manager lists / Quick Info panels.
 */
export const ManagerLoadingBlock: React.FC<ManagerLoadingBlockProps> = ({
  rows = 3,
  label = 'Loading…',
  compact = false,
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-label={label}
    style={{
      ...cardStyle,
      padding: compact ? 14 : 20,
    }}
  >
    <p style={{ margin: '0 0 12px', fontSize: 12, color: t.grayMuted }}>{label}</p>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          height: compact ? 12 : 14,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${t.grayLight} 25%, ${t.beige} 50%, ${t.grayLight} 75%)`,
          backgroundSize: '200% 100%',
          marginBottom: i < rows - 1 ? 10 : 0,
          opacity: 0.85,
          animation: 'managerPulse 1.2s ease-in-out infinite',
        }}
      />
    ))}
    <style>{`
      @keyframes managerPulse {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
    `}</style>
  </div>
);

export default ManagerLoadingBlock;
