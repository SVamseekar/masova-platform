import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetConnectionsQuery,
  useUpsertConnectionMutation,
  type AggregatorPlatform,
} from '../../store/api/aggregatorApi';
import { cardStyle, t, sectionTitleStyle } from './manager-tokens';

const PLATFORMS: { id: AggregatorPlatform; label: string; color: string }[] = [
  { id: 'WOLT',      label: 'Wolt',      color: '#009DE0' },
  { id: 'DELIVEROO', label: 'Deliveroo', color: '#00CCBC' },
  { id: 'JUST_EAT',  label: 'Just Eat',  color: '#FF8000' },
  { id: 'UBER_EATS', label: 'Uber Eats', color: '#000000' },
];

const AggregatorHubPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data: connections = [], isLoading, error } = useGetConnectionsQuery(storeId, { skip: !storeId });
  const [upsertConnection, { isLoading: isSaving }] = useUpsertConnectionMutation();

  const [editingPlatform, setEditingPlatform] = useState<AggregatorPlatform | null>(null);
  const [commissionInput, setCommissionInput] = useState('');
  const [saveError, setSaveError] = useState('');

  const getConnection = (platform: AggregatorPlatform) =>
    connections.find((c) => c.platform === platform);

  const handleEdit = (platform: AggregatorPlatform) => {
    const conn = getConnection(platform);
    setEditingPlatform(platform);
    setCommissionInput(conn ? String(conn.commissionPercent) : '');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editingPlatform) return;
    const pct = parseFloat(commissionInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setSaveError('Commission must be between 0 and 100');
      return;
    }
    try {
      await upsertConnection({ storeId, platform: editingPlatform, commissionPercent: pct }).unwrap();
      setEditingPlatform(null);
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
  };

  if (isLoading) return <div style={{ padding: 24 }}>Loading aggregator settings…</div>;
  if (error) return <div style={{ padding: 24, color: t.red }}>Failed to load aggregator settings.</div>;
  if (!storeId) return <div style={{ padding: 24 }}>Select a store to manage aggregator settings.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={sectionTitleStyle}>Aggregator Hub</h2>
      <p style={{ color: t.gray, marginBottom: 24, fontSize: 14 }}>
        Configure commission % per platform. Net payout is calculated automatically at order entry.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {PLATFORMS.map(({ id, label, color }) => {
          const conn = getConnection(id);
          const isEditing = editingPlatform === id;

          return (
            <div key={id} style={{ ...cardStyle, borderTop: `4px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                  background: color, color: '#fff', fontSize: 12, fontWeight: 700,
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: conn?.active ? t.green : t.gray }}>
                  {conn ? (conn.active ? 'Configured' : 'Inactive') : 'Not configured'}
                </span>
              </div>

              {isEditing ? (
                <>
                  <label style={{ fontSize: 12, color: t.gray, display: 'block', marginBottom: 4 }}>
                    Commission %
                  </label>
                  <input
                    type="number"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    min="0" max="100" step="0.5"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${t.grayLight}`, fontSize: 14,
                      marginBottom: 8, boxSizing: 'border-box' as const,
                    }}
                  />
                  {saveError && <p style={{ color: t.red, fontSize: 12, margin: '0 0 8px' }}>{saveError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                        background: t.orange, color: '#fff', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingPlatform(null)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        border: `1px solid ${t.grayLight}`, background: '#fff', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: t.black }}>
                    {conn ? `${conn.commissionPercent}%` : '—'}
                  </p>
                  <p style={{ fontSize: 12, color: t.gray, margin: '0 0 12px' }}>commission</p>
                  <button
                    onClick={() => handleEdit(id)}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 8,
                      border: `1px solid ${t.grayLight}`, background: '#fff', cursor: 'pointer',
                      fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {conn ? 'Edit' : 'Configure'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AggregatorHubPage;
