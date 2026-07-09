import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useValidatePINMutation } from '../../../store/api/userApi';
import { getRtkErrorMessage } from '../../shared/rtkError';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface PINAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (userData: { userId: string; name: string; type: string; role: string; storeId: string }) => void;
}

export const PINAuthModal: React.FC<PINAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef0 = useRef<HTMLInputElement>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);
  const inputRef4 = useRef<HTMLInputElement>(null);
  const inputRefs = useMemo(
    () => [inputRef0, inputRef1, inputRef2, inputRef3, inputRef4],
    [inputRef0, inputRef1, inputRef2, inputRef3, inputRef4]
  );

  const [validatePIN] = useValidatePINMutation();

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen, inputRefs]);

  const handleSubmit = async () => {
    const pinString = pin.join('');

    if (pinString.length !== 5) {
      setError('Please enter complete 5-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validatePIN({ pin: pinString }).unwrap();

      // Success - user authenticated
      onAuthenticated({
        userId: result.userId,
        name: result.name,
        type: result.type,
        role: result.role,
        storeId: result.storeId
      });

      // Reset and close
      resetPIN();
      onClose();
    } catch (err: unknown) {
      setError(getRtkErrorMessage(err, 'Invalid PIN'));
      setPin(['', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resetPIN = () => {
    setPin(['', '', '', '', '']);
    setError('');
  };

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all digits entered
    if (index === 4 && value) {
      const fullPin = [...newPin.slice(0, 4), value].join('');
      if (fullPin.length === 5) {
        setTimeout(() => handleSubmit(), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs[index - 1].current?.focus();
      } else {
        // Clear current digit
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 4) {
      inputRefs[index + 1].current?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);

    if (pastedData.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < Math.min(pastedData.length, 5); i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);

      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, 4);
      inputRefs[nextIndex].current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} data-testid="pin-auth-modal-overlay">
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pos-pin-title">
        <div style={styles.header}>
          <h2 id="pos-pin-title" style={styles.title}>Cashier PIN</h2>
          <p style={styles.subtitle}>Enter your 5-digit PIN to authorize this charge</p>
        </div>

        <div style={styles.pinInputContainer}>
          {[0, 1, 2, 3, 4].map((index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[index]}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                ...styles.pinInput,
                ...(error ? styles.pinInputError : {})
              }}
              disabled={loading}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <WarningAmberIcon style={{ fontSize: '18px', color: '#d32f2f' }} />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <div style={styles.actions}>
          <button
            onClick={() => {
              resetPIN();
              onClose();
            }}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pin.join('').length !== 5}
            style={{
              ...styles.submitButton,
              ...(loading || pin.join('').length !== 5 ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </div>

        <div style={styles.helpText}>
          <p>Don't have a PIN? Contact your manager.</p>
        </div>
      </div>
    </div>
  );
};

const CASHIER_BLUE = '#2196F3';

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(6px)',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '36px 32px',
    maxWidth: '440px',
    width: '92%',
    boxShadow: '0 24px 64px rgba(33, 150, 243, 0.25)',
    borderTop: `4px solid ${CASHIER_BLUE}`,
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },
  pinInputContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  pinInput: {
    width: '56px',
    height: '64px',
    minWidth: 48,
    minHeight: 48,
    fontSize: '28px',
    fontWeight: 700,
    textAlign: 'center',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.15s ease',
    outline: 'none',
    fontFamily: 'ui-monospace, monospace',
  },
  pinInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#fef2f2',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  errorIcon: {
    fontSize: '18px',
    color: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    minHeight: 52,
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: CASHIER_BLUE,
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(33, 150, 243, 0.35)',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    opacity: 0.65,
    boxShadow: 'none',
  },
  helpText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },
};
