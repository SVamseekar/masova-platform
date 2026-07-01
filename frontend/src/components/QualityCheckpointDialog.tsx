import React, { useState } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../styles/neumorphic-utils';
import { Order, QualityCheckpoint, useUpdateQualityCheckpointMutation } from '../store/api/orderApi';

interface QualityCheckpointDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

const QualityCheckpointDialog: React.FC<QualityCheckpointDialogProps> = ({ open, onClose, order }) => {
  const [updateCheckpoint] = useUpdateQualityCheckpointMutation();
  const [notes, setNotes] = useState<string>('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<QualityCheckpoint | null>(null);

  if (!open || !order || !order.qualityCheckpoints) {
    return null;
  }

  const handleUpdateCheckpoint = async (
    checkpointName: string,
    status: QualityCheckpoint['status']
  ) => {
    try {
      await updateCheckpoint({
        orderId: order.id,
        checkpointName,
        status,
        notes: notes || undefined,
      }).unwrap();
      setNotes('');
      setSelectedCheckpoint(null);
    } catch (error) {
      console.error('Failed to update checkpoint:', error);
    }
  };

  const getStatusIcon = (status: QualityCheckpoint['status']) => {
    switch (status) {
      case 'PASSED': return '✅';
      case 'FAILED': return '❌';
      case 'SKIPPED': return '⏭️';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: QualityCheckpoint['status']) => {
    switch (status) {
      case 'PASSED': return colors.semantic.success;
      case 'FAILED': return colors.semantic.error;
      case 'SKIPPED': return colors.text.tertiary;
      default: return colors.semantic.warning;
    }
  };

  const getCheckpointLabel = (type: QualityCheckpoint['type']) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const pendingCheckpoints = order.qualityCheckpoints.filter(cp => cp.status === 'PENDING');
  const completedCheckpoints = order.qualityCheckpoints.filter(cp => cp.status !== 'PENDING');

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: spacing[4],
    fontFamily: typography.fontFamily.primary,
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'lg'),
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const headerStyles: React.CSSProperties = {
    borderBottom: `2px solid ${colors.surface.tertiary}`,
    paddingBottom: spacing[4],
    marginBottom: spacing[6],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    margin: 0,
  };

  const closeButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'full'),
    width: '36px',
    height: '36px',
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    transition: 'all 0.2s',
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  };

  const checkpointItemStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[3],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const actionButtonStyles = (color: string): React.CSSProperties => ({
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    border: 'none',
    padding: `${spacing[2]} ${spacing[3]}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    background: color,
    transition: 'all 0.2s',
    marginLeft: spacing[2],
  });

  const inputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'md'),
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.primary,
    color: colors.text.primary,
    border: 'none',
    resize: 'vertical' as const,
    minHeight: '80px',
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing[1]} ${spacing[3]}`,
    backgroundColor: color,
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.full,
    boxShadow: `0 2px 8px ${color}40`,
  });

  const primaryButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    border: 'none',
    padding: `${spacing[3]} ${spacing[6]}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    boxShadow: shadows.brand.primary,
    transition: 'all 0.2s',
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={titleStyles}>Quality Checkpoints - Order #{order.orderNumber}</h2>
            <button style={closeButtonStyles} onClick={onClose}>✕</button>
          </div>
          <div style={{ marginTop: spacing[2], color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            {order.items.length} items | {order.orderType}
            {order.actualPreparationTime && ` | Prep Time: ${order.actualPreparationTime} min`}
          </div>
        </div>

        {/* Pending Checkpoints */}
        {pendingCheckpoints.length > 0 && (
          <div style={{ marginBottom: spacing[6] }}>
            <h3 style={sectionTitleStyles}>⏳ Pending Checks ({pendingCheckpoints.length})</h3>
            {pendingCheckpoints.map((checkpoint) => (
              <div
                key={checkpoint.checkpointName}
                style={{
                  ...checkpointItemStyles,
                  backgroundColor: selectedCheckpoint?.checkpointName === checkpoint.checkpointName
                    ? colors.surface.secondary
                    : colors.surface.primary,
                }}
              >
                <div>
                  <div style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                    {checkpoint.checkpointName}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing[1] }}>
                    {getCheckpointLabel(checkpoint.type)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: spacing[2] }}>
                  <button
                    style={actionButtonStyles(colors.semantic.success)}
                    onClick={() => handleUpdateCheckpoint(checkpoint.checkpointName, 'PASSED')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ✓ Pass
                  </button>
                  <button
                    style={actionButtonStyles(colors.semantic.error)}
                    onClick={() => setSelectedCheckpoint(checkpoint)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ✗ Fail
                  </button>
                  <button
                    style={actionButtonStyles(colors.text.tertiary)}
                    onClick={() => handleUpdateCheckpoint(checkpoint.checkpointName, 'SKIPPED')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ⏭ Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add notes for failed checkpoint */}
        {selectedCheckpoint && (
          <div
            style={{
              ...createCard('base', 'base'),
              marginBottom: spacing[6],
              backgroundColor: colors.semantic.errorLight + '20',
            }}
          >
            <h4 style={{ ...sectionTitleStyles, color: colors.semantic.error }}>
              Add notes for failed checkpoint: {selectedCheckpoint.checkpointName}
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue..."
              style={inputStyles}
            />
            <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[3], justifyContent: 'flex-end' }}>
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'sm', 'md'),
                  border: 'none',
                  padding: `${spacing[2]} ${spacing[4]}`,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                }}
                onClick={() => setSelectedCheckpoint(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...createNeumorphicSurface('raised', 'sm', 'md'),
                  border: 'none',
                  padding: `${spacing[2]} ${spacing[4]}`,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.inverse,
                  background: colors.semantic.error,
                  boxShadow: shadows.brand.error,
                }}
                onClick={() => handleUpdateCheckpoint(selectedCheckpoint.checkpointName, 'FAILED')}
              >
                Mark as Failed
              </button>
            </div>
          </div>
        )}

        {/* Completed Checkpoints */}
        {completedCheckpoints.length > 0 && (
          <div>
            <h3 style={sectionTitleStyles}>✓ Completed ({completedCheckpoints.length})</h3>
            {completedCheckpoints.map((checkpoint) => (
              <div key={checkpoint.checkpointName} style={checkpointItemStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  <span style={{ fontSize: typography.fontSize.xl }}>{getStatusIcon(checkpoint.status)}</span>
                  <div>
                    <div style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                      {checkpoint.checkpointName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] }}>
                      <span style={badgeStyles(getStatusColor(checkpoint.status))}>
                        {checkpoint.status}
                      </span>
                      {checkpoint.notes && (
                        <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                          | {checkpoint.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: spacing[6], textAlign: 'center' }}>
          <button
            style={primaryButtonStyles}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityCheckpointDialog;
