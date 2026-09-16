import React from 'react';
import { t } from '../manager-tokens';
import { ManagerEmptyState } from './ManagerEmptyState';
import { ManagerErrorState } from './ManagerErrorState';
import { ManagerLoadingBlock } from './ManagerLoadingBlock';

export interface ManagerPageFrameProps {
  title: string;
  subtitle?: string;
  /** Store code shown in header context (e.g. DOM001). */
  storeId?: string;
  primaryAction?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  /** Full-section loading (replaces children). */
  loading?: boolean;
  /** Full-section error (replaces children). */
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** Full-section empty (replaces children). */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Shared chrome for manager shell section content.
 * Enforces loading | error | empty | data as first-class states.
 */
export const ManagerPageFrame: React.FC<ManagerPageFrameProps> = ({
  title,
  subtitle,
  storeId,
  primaryAction,
  tabs,
  children,
  loading = false,
  error = false,
  errorMessage,
  onRetry,
  empty = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
}) => (
  <div style={{ fontFamily: t.font, minHeight: 200 }} data-testid="manager-page-frame">
    {/* Shell already prints the section title — only show actions + store here. */}
    {(primaryAction || storeId) && (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: tabs ? 10 : 16,
        }}
      >
        {storeId ? (
          <p style={{ margin: 0, fontSize: 12, color: t.gray }} data-testid="manager-frame-store">
            {storeId}
          </p>
        ) : <span />}
        {primaryAction && <div style={{ flexShrink: 0 }}>{primaryAction}</div>}
      </header>
    )}
    <span style={{ display: 'none' }} aria-hidden>{title}{subtitle}</span>

    {tabs && <div style={{ marginBottom: 16 }}>{tabs}</div>}

    {loading && <ManagerLoadingBlock rows={4} label="Loading section…" />}
    {!loading && error && (
      <ManagerErrorState message={errorMessage} onRetry={onRetry} />
    )}
    {!loading && !error && empty && (
      <ManagerEmptyState title={emptyTitle} description={emptyDescription} />
    )}
    {!loading && !error && !empty && children}
  </div>
);

export default ManagerPageFrame;
