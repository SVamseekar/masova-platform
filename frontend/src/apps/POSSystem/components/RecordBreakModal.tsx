// src/apps/POSSystem/components/RecordBreakModal.tsx
import React, { useState } from 'react';
import { colors, shadows, spacing, typography, borderRadius } from '../../../styles/design-tokens';
import Button from '../../../components/ui/neumorphic/Button';
import { useRecordBreakMutation } from '../../../store/api/sessionApi';

interface RecordBreakModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordBreakModal: React.FC<RecordBreakModalProps> = ({
  employeeId,
  employeeName,
  onClose,
  onSuccess,
}) => {
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [recordBreak, { isLoading }] = useRecordBreakMutation();

  const presetBreaks = [
    { label: '15 min', value: 15, description: 'Short break' },
    { label: '30 min', value: 30, description: 'Standard break' },
    { label: '60 min', value: 60, description: 'Lunch break' },
  ];

  const handleSubmit = async () => {
    const finalMinutes = customMinutes ? parseInt(customMinutes) : breakMinutes;

    if (finalMinutes <= 0 || finalMinutes > 120) {
      alert('Break time must be between 1 and 120 minutes');
      return;
    }

    try {
      await recordBreak({ employeeId, breakMinutes: finalMinutes }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.data?.error || err?.data?.message || 'Failed to record break');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Record Break</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={styles.subtitle}>
          Recording break for <strong>{employeeName}</strong>
        </p>

        {/* Preset Breaks */}
        <div style={styles.section}>
          <label style={styles.label}>Select Break Duration</label>
          <div style={styles.presetGrid}>
            {presetBreaks.map((preset) => (
              <button
                key={preset.value}
                style={{
                  ...styles.presetButton,
                  ...(breakMinutes === preset.value && !customMinutes ? styles.presetButtonActive : {}),
                }}
                onClick={() => {
                  setBreakMinutes(preset.value);
                  setCustomMinutes('');
                }}
              >
                <div style={styles.presetLabel}>{preset.label}</div>
                <div style={styles.presetDescription}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div style={styles.section}>
          <label style={styles.label}>Or Enter Custom Duration</label>
          <input
            type="number"
            placeholder="Enter minutes (1-120)"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            style={styles.input}
            min={1}
            max={120}
          />
          <p style={styles.hint}>Maximum break: 120 minutes (2 hours)</p>
        </div>

        {/* Validation Info */}
        <div style={styles.infoBox}>
          <strong>Break Time Rules:</strong>
          <ul style={styles.rulesList}>
            <li>Single break cannot exceed 120 minutes</li>
            <li>Total breaks cannot exceed 25% of shift duration</li>
            <li>Minimum 2 hours work required before first break</li>
            <li>Shifts over 6 hours require minimum 30 minutes break</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Recording...' : `Record ${customMinutes || breakMinutes} min Break`}
          </Button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.surface.background,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.raised.lg,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    margin: 0,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: colors.text.tertiary,
    padding: spacing[1],
  },
  subtitle: {
    marginBottom: spacing[5],
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing[5],
  },
  label: {
    display: 'block',
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing[4],
  },
  presetButton: {
    padding: spacing[4],
    border: `2px solid ${colors.surface.border}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.secondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  presetButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  presetLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  presetDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  input: {
    width: '100%',
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    border: `2px solid ${colors.surface.border}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.secondary,
    color: colors.text.primary,
  },
  hint: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  infoBox: {
    padding: spacing[4],
    backgroundColor: colors.info.light,
    borderRadius: borderRadius.md,
    marginBottom: spacing[5],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  rulesList: {
    marginTop: spacing[1],
    marginBottom: 0,
    paddingLeft: spacing[5],
  },
  actions: {
    display: 'flex',
    gap: spacing[4],
    justifyContent: 'flex-end',
  },
};

export default RecordBreakModal;
