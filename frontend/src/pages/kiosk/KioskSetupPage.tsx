import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKioskMode } from '../../hooks/useKioskMode';

/**
 * Kiosk Setup Page
 *
 * Automatically configures kiosk mode when accessed with setup parameters.
 * URL format: /kiosk-setup?token=xxx&refreshToken=yyy&terminalId=zzz
 */
const KioskSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enableKioskMode } = useKioskMode();
  const [status, setStatus] = useState<'configuring' | 'success' | 'error'>('configuring');
  const [message, setMessage] = useState('Configuring kiosk mode...');

  useEffect(() => {
    const setupKiosk = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const terminalId = searchParams.get('terminalId');

        if (!token || !refreshToken || !terminalId) {
          throw new Error('Missing required setup parameters');
        }

        // Configure kiosk mode
        enableKioskMode(token, refreshToken, terminalId);

        setStatus('success');
        setMessage(`Kiosk mode configured successfully for terminal ${terminalId}!`);

        // Redirect to POS after 2 seconds
        setTimeout(() => {
          navigate('/pos?kiosk=true');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Setup failed');
      }
    };

    setupKiosk();
  }, [searchParams, enableKioskMode, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '90%',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {status === 'configuring' && (
          <>
            <div
              style={{
                fontSize: '64px',
                marginBottom: '24px',
                animation: 'spin 2s linear infinite',
              }}
            >
              ⚙️
            </div>
            <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>
              Configuring Kiosk Mode
            </h2>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                fontSize: '64px',
                marginBottom: '24px',
                animation: 'bounce 1s ease-in-out',
              }}
            >
              ✅
            </div>
            <h2 style={{ marginBottom: '16px', color: '#059669' }}>Setup Complete!</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>{message}</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Redirecting to POS...</p>
            <div
              style={{
                marginTop: '24px',
                height: '4px',
                background: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#059669',
                  animation: 'progress 2s linear',
                  width: '0%',
                }}
              />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>❌</div>
            <h2 style={{ marginBottom: '16px', color: '#dc2626' }}>Setup Failed</h2>
            <p style={{ color: '#ef4444', fontSize: '16px', marginBottom: '24px' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }

          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default KioskSetupPage;
