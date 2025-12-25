import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useGetActiveStoresProtectedQuery } from '../../store/api/storeApi';
import {
  useCreateKioskMutation,
  useListKioskAccountsQuery,
  useDeactivateKioskMutation,
  CreateKioskResponse,
} from '../../store/api/kioskApi';

/**
 * Kiosk Management Page
 *
 * Allows managers to:
 * - Create kiosk accounts for POS terminals
 * - View existing kiosk accounts
 * - Regenerate tokens for kiosks
 * - Deactivate kiosk accounts
 */
const KioskManagementPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [selectedStore, setSelectedStore] = useState<string>(user?.storeId || '');
  const [terminalId, setTerminalId] = useState<string>('');
  const [showTokens, setShowTokens] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<CreateKioskResponse | null>(null);

  const { data: stores = [] } = useGetActiveStoresProtectedQuery();
  const { data: kiosks = [], refetch } = useListKioskAccountsQuery(selectedStore, {
    skip: !selectedStore,
  });
  const [createKiosk, { isLoading: creating }] = useCreateKioskMutation();
  const [deactivateKiosk] = useDeactivateKioskMutation();

  const handleCreateKiosk = async () => {
    if (!selectedStore || !terminalId) {
      alert('Please select a store and enter a terminal ID');
      return;
    }

    try {
      const result = await createKiosk({
        storeId: selectedStore,
        terminalId,
      }).unwrap();

      setGeneratedTokens(result);
      setShowTokens(true);
      setTerminalId('');
      refetch();

      alert('Kiosk account created successfully! Copy the tokens from the modal.');
    } catch (error: any) {
      alert('Failed to create kiosk account: ' + (error?.data?.error || error.message));
    }
  };

  const handleDeactivate = async (kioskId: string) => {
    if (!confirm('Are you sure you want to deactivate this kiosk account?')) {
      return;
    }

    try {
      await deactivateKiosk(kioskId).unwrap();
      refetch();
      alert('Kiosk account deactivated successfully');
    } catch (error: any) {
      alert('Failed to deactivate kiosk: ' + (error?.data?.error || error.message));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const generateKioskSetupUrl = () => {
    if (!generatedTokens) return '';

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      kiosk: 'true',
      setup: 'true',
      token: generatedTokens.accessToken,
      refreshToken: generatedTokens.refreshToken,
      terminalId: generatedTokens.terminalId,
    });

    return `${baseUrl}/kiosk-setup?${params.toString()}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Kiosk Management</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Create and manage kiosk accounts for POS terminals
      </p>

      {/* Create New Kiosk */}
      <div
        style={{
          background: '#f5f5f5',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginBottom: '16px' }}>Create New Kiosk Account</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Store
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          >
            <option value="">Select a store...</option>
            {stores.map((store: any) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.id})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Terminal ID
          </label>
          <input
            type="text"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            placeholder="e.g., POS-01, POS-02"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
            Use a unique identifier for this terminal (e.g., POS-01, POS-02)
          </small>
        </div>

        <button
          onClick={handleCreateKiosk}
          disabled={creating || !selectedStore || !terminalId}
          style={{
            padding: '12px 24px',
            background: creating || !selectedStore || !terminalId ? '#ccc' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: creating || !selectedStore || !terminalId ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? 'Creating...' : 'Create Kiosk Account'}
        </button>
      </div>

      {/* Existing Kiosks */}
      {selectedStore && (
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2 style={{ marginBottom: '16px' }}>Existing Kiosk Accounts</h2>

          {kiosks.length === 0 ? (
            <p style={{ color: '#666' }}>No kiosk accounts found for this store</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>
                      Terminal ID
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>
                      Last Access
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kiosks.map((kiosk: any) => (
                    <tr key={kiosk.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>
                        {kiosk.employeeDetails?.terminalId || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: kiosk.isActive ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {kiosk.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#666' }}>
                        {kiosk.employeeDetails?.lastKioskAccess
                          ? new Date(kiosk.employeeDetails.lastKioskAccess).toLocaleString()
                          : 'Never'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleDeactivate(kiosk.id)}
                          disabled={!kiosk.isActive}
                          style={{
                            padding: '6px 16px',
                            background: !kiosk.isActive ? '#ccc' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: !kiosk.isActive ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Token Display Modal */}
      {showTokens && generatedTokens && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px',
            }}
          >
            <h2 style={{ marginBottom: '16px' }}>Kiosk Account Created! 🎉</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Copy these tokens and configure the POS terminal. You will not be able to see them
              again.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Option 1: Use Setup URL (Recommended)</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                Open this URL on the terminal browser to auto-configure:
              </p>
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '8px',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                {generateKioskSetupUrl()}
              </div>
              <button
                onClick={() => copyToClipboard(generateKioskSetupUrl())}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Copy Setup URL
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Option 2: Manual Configuration</h3>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Terminal ID:</strong>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                  }}
                >
                  {generatedTokens.terminalId}
                </div>
                <button
                  onClick={() => copyToClipboard(generatedTokens.terminalId)}
                  style={{
                    padding: '6px 12px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Access Token:</strong>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    marginBottom: '4px',
                    fontSize: '12px',
                    maxHeight: '100px',
                    overflow: 'auto',
                  }}
                >
                  {generatedTokens.accessToken}
                </div>
                <button
                  onClick={() => copyToClipboard(generatedTokens.accessToken)}
                  style={{
                    padding: '6px 12px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Refresh Token:</strong>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    marginBottom: '4px',
                    fontSize: '12px',
                    maxHeight: '100px',
                    overflow: 'auto',
                  }}
                >
                  {generatedTokens.refreshToken}
                </div>
                <button
                  onClick={() => copyToClipboard(generatedTokens.refreshToken)}
                  style={{
                    padding: '6px 12px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>

              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                }}
              >
                <strong>Expires in:</strong> {generatedTokens.expiresIn}
              </div>
            </div>

            <button
              onClick={() => setShowTokens(false)}
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskManagementPage;
