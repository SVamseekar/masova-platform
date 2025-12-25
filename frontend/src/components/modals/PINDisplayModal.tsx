import React, { useState } from 'react';

interface PINDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeType: string;
  pin: string;
}

export const PINDisplayModal: React.FC<PINDisplayModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  employeeType,
  pin,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIN:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Employee Created Successfully</h2>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.warningBanner}>
            <svg
              style={styles.warningIcon}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p style={styles.warningTitle}>Save this PIN - it will not be shown again!</p>
              <p style={styles.warningText}>
                This is the only time you'll see this PIN. Make sure to save it securely.
              </p>
            </div>
          </div>

          <div style={styles.pinSection}>
            <label style={styles.pinLabel}>5-Digit PIN</label>
            <div style={styles.pinDisplay}>
              {pin.split('').map((digit, index) => (
                <div key={index} style={styles.pinDigit}>
                  {digit}
                </div>
              ))}
            </div>
            <button
              style={{
                ...styles.copyButton,
                ...(copied ? styles.copyButtonSuccess : {}),
              }}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg style={styles.buttonIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg style={styles.buttonIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy PIN
                </>
              )}
            </button>
          </div>

          <div style={styles.detailsSection}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Employee Name:</span>
              <span style={styles.detailValue}>{employeeName}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Employee Type:</span>
              <span style={styles.detailValue}>{employeeType}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>PIN Usage:</span>
              <span style={styles.detailValue}>Clock-in, POS Orders, Authentication</span>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.confirmButton} onClick={onClose}>
            I've Saved the PIN
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#f0f0f3',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '20px 20px 60px #d1d1d4, -20px -20px 60px #ffffff',
    overflow: 'hidden',
    animation: 'slideIn 0.3s ease-out',
  },
  header: {
    padding: '24px 28px',
    borderBottom: '2px solid #e0e0e3',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(145deg, #f5f5f8, #e8e8eb)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#2c3e50',
    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    color: '#7f8c8d',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  content: {
    padding: '28px',
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1)',
  },
  warningIcon: {
    width: '24px',
    height: '24px',
    color: '#ff9800',
    flexShrink: 0,
  },
  warningTitle: {
    margin: '0 0 4px 0',
    fontWeight: '700',
    color: '#d84315',
    fontSize: '14px',
  },
  warningText: {
    margin: 0,
    fontSize: '13px',
    color: '#6d4c41',
  },
  pinSection: {
    marginBottom: '24px',
  },
  pinLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#5a6c7d',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pinDisplay: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  pinDigit: {
    width: '60px',
    height: '70px',
    backgroundColor: '#f0f0f3',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#2c3e50',
    boxShadow: 'inset 6px 6px 12px #d1d1d4, inset -6px -6px 12px #ffffff',
    border: '2px solid #e0e0e3',
  },
  copyButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    boxShadow: '4px 4px 10px rgba(76, 175, 80, 0.3)',
  },
  copyButtonSuccess: {
    backgroundColor: '#2e7d32',
  },
  buttonIcon: {
    width: '20px',
    height: '20px',
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.05)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f3',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    color: '#2c3e50',
    fontWeight: '600',
  },
  footer: {
    padding: '20px 28px',
    borderTop: '2px solid #e0e0e3',
    background: 'linear-gradient(145deg, #e8e8eb, #f5f5f8)',
  },
  confirmButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '6px 6px 12px #d1d1d4, -6px -6px 12px #ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};
