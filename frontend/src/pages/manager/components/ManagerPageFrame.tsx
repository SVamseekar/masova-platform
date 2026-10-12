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
  /** Hide the page heading when the section prints its own (e.g. the dashboard greeting). */
  hideHeading?: boolean;
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
  hideHeading = false,
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
    {(!hideHeading || primaryAction) && <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: tabs ? 12 : 20,
      }}
    >
      <div>
        {!hideHeading && <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: t.black, lineHeight: 1.15 }}>{title}</h2>}
        {!hideHeading && subtitle && <p style={{ margin: '6px 0 0', fontSize: 15, color: t.gray }}>{subtitle}</p>}
        {storeId && (
          <span style={{ display: 'none' }} data-testid="manager-frame-store">{storeId}</span>
        )}
      </div>
      {primaryAction && <div style={{ flexShrink: 0 }}>{primaryAction}</div>}
    </header>}

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
