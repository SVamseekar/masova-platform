import React, { useState, useRef, useEffect } from 'react';
import { useValidatePINMutation } from '../../../store/api/userApi';

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
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const [validatePIN] = useValidatePINMutation();

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen]);

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
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid PIN');
      resetPIN();
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Enter Your PIN</h2>
          <p style={styles.subtitle}>Enter your 5-digit PIN to start taking orders</p>
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
            <span style={styles.errorIcon}>⚠</span>
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
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.3s ease-out'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  pinInputContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  pinInput: {
    width: '60px',
    height: '70px',
    fontSize: '32px',
    fontWeight: 700,
    textAlign: 'center',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'monospace'
  },
  pinInputError: {
    borderColor: '#ef5350',
    backgroundColor: '#ffebee'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#ffebee',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  errorIcon: {
    fontSize: '18px',
    color: '#d32f2f'
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '14px',
    fontWeight: 500
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  cancelButton: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitButton: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#2196f3',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitButtonDisabled: {
    backgroundColor: '#b0bec5',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  helpText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
    marginTop: '8px'
  }
};
