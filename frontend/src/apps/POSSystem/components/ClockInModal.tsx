// src/apps/POSSystem/components/ClockInModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { colors, shadows, spacing } from '../../../styles/design-tokens';
import Button from '../../../components/ui/neumorphic/Button';
import { useValidatePINMutation } from '../../../store/api/userApi';
import { useClockInWithPinMutation } from '../../../store/api/sessionApi';
import { useSnackbar } from 'notistack';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  refetchSessions?: () => void; // Optional callback to refetch sessions
}

type AuthStep = 'employee' | 'manager';

const ClockInModal: React.FC<ClockInModalProps> = ({ isOpen, onClose, storeId, refetchSessions }) => {
  const { enqueueSnackbar } = useSnackbar();

  // Step state
  const [step, setStep] = useState<AuthStep>('employee');

  // Employee PIN state
  const [employeePIN, setEmployeePIN] = useState<string>('');
  const [employeeData, setEmployeeData] = useState<any>(null);

  // Manager PIN state
  const [managerPIN, setManagerPIN] = useState<string>('');

  // UI state
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const employeePinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const managerPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [validatePIN] = useValidatePINMutation();
  const [clockInWithPin] = useClockInWithPinMutation();

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  // Focus first input when step changes
  useEffect(() => {
    if (isOpen) {
      if (step === 'employee') {
        setTimeout(() => employeePinRefs[0].current?.focus(), 100);
      } else {
        setTimeout(() => managerPinRefs[0].current?.focus(), 100);
      }
    }
  }, [step, isOpen]);

  const resetModal = () => {
    setStep('employee');
    setEmployeePIN('');
    setManagerPIN('');
    setEmployeeData(null);
    setError('');
    setIsLoading(false);
  };

  const handleEmployeePINChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPIN = employeePIN.split('');
    newPIN[index] = value;
    setEmployeePIN(newPIN.join('').slice(0, 5));

    if (value && index < 4) {
      employeePinRefs[index + 1].current?.focus();
    }
  };

  const handleManagerPINChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPIN = managerPIN.split('');
    newPIN[index] = value;
    setManagerPIN(newPIN.join('').slice(0, 5));

    if (value && index < 4) {
      managerPinRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, pinRefs: Array<React.RefObject<HTMLInputElement | null>>, currentPIN: string) => {
    if (e.key === 'Backspace') {
      if (!currentPIN[index] && index > 0) {
        pinRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'Enter') {
      if (step === 'employee') {
        handleEmployeePINSubmit();
      } else {
        handleManagerPINSubmit();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent, setPIN: (pin: string) => void, pinRefs: Array<React.RefObject<HTMLInputElement | null>>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    setPIN(pastedData);
    const focusIndex = Math.min(pastedData.length, 4);
    pinRefs[focusIndex].current?.focus();
  };

  // Step 1: Validate employee PIN
  const handleEmployeePINSubmit = async () => {
    if (employeePIN.length !== 5) {
      setError('Please enter complete 5-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await validatePIN({ pin: employeePIN }).unwrap();
      setEmployeeData(result);

      // Check if manager/assistant manager (no second auth needed)
      if (result.type === 'MANAGER' || result.type === 'ASSISTANT_MANAGER') {
        // Direct clock-in for managers
        await performClockIn(result.userId, employeePIN);
      } else {
        // Staff/Driver - need manager auth
        setStep('manager');
      }
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid PIN');
      setEmployeePIN('');
      employeePinRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Validate manager PIN (for staff)
  const handleManagerPINSubmit = async () => {
    if (managerPIN.length !== 5) {
      setError('Please enter complete 5-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const managerResult = await validatePIN({ pin: managerPIN }).unwrap();

      // Verify this is actually a manager
      if (managerResult.type !== 'MANAGER' && managerResult.type !== 'ASSISTANT_MANAGER') {
        setError('Only managers can authorize staff clock-in');
        setManagerPIN('');
        managerPinRefs[0].current?.focus();
        setIsLoading(false);
        return;
      }

      // Verify same store
      if (managerResult.storeId !== employeeData.storeId && managerResult.storeId !== storeId) {
        setError('Manager must be from same store');
        setManagerPIN('');
        managerPinRefs[0].current?.focus();
        setIsLoading(false);
        return;
      }

      // Clock in staff with manager authorization
      await performClockIn(employeeData.userId, employeePIN, managerResult.userId);
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid manager PIN');
      setManagerPIN('');
      managerPinRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const performClockIn = async (employeeId: string, pin: string, managerId?: string) => {
    try {
      await clockInWithPin({
        employeeId,
        pin,
        authorizedBy: managerId,
      } as any).unwrap();

      enqueueSnackbar(`${employeeData?.name || 'Employee'} clocked in successfully`, { variant: 'success' });

      // Immediately refetch sessions if callback provided
      if (refetchSessions) {
        refetchSessions();
      }

      onClose();
      resetModal();
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to clock in');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {step === 'employee' ? '🔐 Clock In' : '🔑 Manager Authorization'}
          </h2>
          <button onClick={onClose} style={styles.closeButton} disabled={isLoading}>×</button>
        </div>

        <div style={styles.content}>
          {step === 'employee' ? (
            <>
              <p style={styles.instruction}>Enter your 5-digit PIN to clock in</p>

              <div style={styles.pinContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <input
                    key={index}
                    ref={employeePinRefs[index]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={employeePIN[index] || ''}
                    onChange={(e) => handleEmployeePINChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e, employeePinRefs, employeePIN)}
                    onPaste={(e) => handlePaste(e, setEmployeePIN, employeePinRefs)}
                    style={{
                      ...styles.pinInput,
                      ...(error ? styles.pinInputError : {})
                    }}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={styles.employeeInfo}>
                <p style={styles.employeeLabel}>Clocking in:</p>
                <p style={styles.employeeName}>{employeeData?.name}</p>
                <p style={styles.employeeRole}>{employeeData?.type || employeeData?.role}</p>
              </div>

              <p style={styles.instruction}>Manager: Enter your PIN to authorize</p>

              <div style={styles.pinContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <input
                    key={index}
                    ref={managerPinRefs[index]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={managerPIN[index] || ''}
                    onChange={(e) => handleManagerPINChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e, managerPinRefs, managerPIN)}
                    onPaste={(e) => handlePaste(e, setManagerPIN, managerPinRefs)}
                    style={{
                      ...styles.pinInput,
                      ...(error ? styles.pinInputError : {})
                    }}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                ))}
              </div>
            </>
          )}

          {error && (
            <div style={styles.errorMessage}>
              <span style={styles.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div style={styles.actions}>
            {step === 'manager' && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStep('employee');
                  setManagerPIN('');
                  setError('');
                }}
                disabled={isLoading}
              >
                ← Back
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={step === 'employee' ? handleEmployeePINSubmit : handleManagerPINSubmit}
              disabled={isLoading || (step === 'employee' ? employeePIN.length !== 5 : managerPIN.length !== 5)}
            >
              {isLoading ? 'Verifying...' : step === 'employee' ? 'Continue' : 'Clock In'}
            </Button>
          </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    width: '90%',
    maxWidth: '500px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[6],
    borderBottom: `2px solid ${colors.surface.border}`,
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  content: {
    padding: spacing[6],
  },
  instruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: spacing[6],
  },
  employeeInfo: {
    textAlign: 'center',
    padding: spacing[4],
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: spacing[6],
  },
  employeeLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  employeeName: {
    margin: `${spacing[2]} 0`,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  employeeRole: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  pinContainer: {
    display: 'flex',
    gap: spacing[3],
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  pinInput: {
    width: '60px',
    height: '70px',
    fontSize: '32px',
    fontWeight: 700,
    textAlign: 'center' as const,
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'monospace',
  },
  pinInputError: {
    borderColor: '#ef5350',
    backgroundColor: '#ffebee',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    borderRadius: '8px',
    marginBottom: spacing[4],
    fontSize: '14px',
    fontWeight: 500,
  },
  errorIcon: {
    fontSize: '18px',
  },
  actions: {
    display: 'flex',
    gap: spacing[3],
    justifyContent: 'flex-end',
  },
};

export default ClockInModal;
