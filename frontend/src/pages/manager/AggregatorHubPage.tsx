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

  const { data: connections = [], isLoading, error, refetch } = useGetConnectionsQuery(storeId, { skip: !storeId });
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

  if (!storeId) return <div style={{ padding: 8, color: t.gray }}>Select a store to manage aggregator settings.</div>;

  return (
    <div>
      <h2 style={sectionTitleStyle}>Aggregator Hub</h2>
      <p style={{ color: t.gray, marginBottom: 16, fontSize: 14 }}>
        Configure commission % per platform. Net payout is calculated automatically at order entry.
      </p>
      {isLoading && <p style={{ fontSize: 13, color: t.gray, marginBottom: 12 }}>Loading aggregator settings…</p>}
      {error && (
        <div style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${t.red}` }}>
          <p style={{ margin: 0, color: t.red, fontSize: 13, fontWeight: 600 }}>Could not load saved aggregator settings.</p>
          <p style={{ margin: '6px 0 10px', fontSize: 12, color: t.gray }}>You can still configure platforms below. Retry after the service is up.</p>
          <button type="button" onClick={() => void refetch()} style={{
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.grayLight}`,
            background: t.white, cursor: 'pointer', fontWeight: 600, fontSize: 12,
          }}>Retry</button>
        </div>
      )}

      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Platform', 'Status', 'Commission', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, color: t.gray, borderBottom: `1px solid ${t.grayLight}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLATFORMS.map(({ id, label, color }) => {
              const conn = getConnection(id);
              const isEditing = editingPlatform === id;
              return (
                <tr key={id}>
                  <td style={{ padding: '12px 8px', borderBottom: `1px solid ${t.grayLight}` }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: color, color: '#fff', fontSize: 12, fontWeight: 700 }}>{label}</span>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: `1px solid ${t.grayLight}`, fontSize: 13, color: conn ? t.green : t.gray }}>
                    {conn ? (conn.active ? 'Configured' : 'Inactive') : 'Not configured'}
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: `1px solid ${t.grayLight}` }}>
                    {isEditing ? (
                      <div>
                        <input type="number" value={commissionInput} onChange={(e) => setCommissionInput(e.target.value)}
                          min="0" max="100" step="0.5"
                          style={{ width: 88, padding: '6px 8px', borderRadius: 8, border: `1px solid ${t.grayLight}` }} />
                        {saveError && <p style={{ color: t.red, fontSize: 12, margin: '4px 0 0' }}>{saveError}</p>}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700 }}>{conn ? `${conn.commissionPercent}%` : '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: `1px solid ${t.grayLight}`, textAlign: 'right' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={handleSave} disabled={isSaving} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, background: t.orange, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                          {isSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditingPlatform(null)} style={{ padding: '6px 12px', border: `1px solid ${t.grayLight}`, borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(id)} style={{ padding: '6px 12px', border: `1px solid ${t.grayLight}`, borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        {conn ? 'Edit' : 'Configure'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AggregatorHubPage;
