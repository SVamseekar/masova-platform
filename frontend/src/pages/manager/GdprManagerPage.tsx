import React, { useMemo, useState } from 'react';
import { t, cardStyle, sectionTitleStyle, tableHeaderStyle, tableCellStyle, selectStyle, statusBadge } from './manager-tokens';
import {
  useGetGdprRequestsQuery,
  useProcessGdprRequestMutation,
  useLazyExportUserDataQuery,
  useGetGdprAuditLogQuery,
  type GdprDataRequest,
  type GdprRequestType,
} from '../../store/api/gdprApi';
import { useGetAllCustomersQuery } from '../../store/api/customerApi';

interface Props {
  storeId: string;
}

const REQUEST_TYPE_MAP: Record<string, GdprRequestType> = {
  access: 'access',
  ACCESS: 'access',
  erasure: 'erasure',
  ERASURE: 'erasure',
  portability: 'portability',
  DATA_PORTABILITY: 'portability',
  rectification: 'rectification',
  RECTIFICATION: 'rectification',
};

const GdprManagerPage: React.FC<Props> = ({ storeId: _storeId }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [processError, setProcessError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const activeUserId = selectedUserId || searchUserId;

  const { data: customers = [], isLoading: loadingCustomers } = useGetAllCustomersQuery(undefined);
  const {
    data: requests = [],
    isLoading: loadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetGdprRequestsQuery(activeUserId, { skip: !activeUserId });

  const {
    data: auditLog = [],
    isLoading: loadingAudit,
    error: auditError,
  } = useGetGdprAuditLogQuery(activeUserId, { skip: !activeUserId });

  const [processGdprRequest, { isLoading: processing }] = useProcessGdprRequestMutation();
  const [triggerExport, { isLoading: exporting }] = useLazyExportUserDataQuery();

  const pendingRequests = useMemo(
    () => requests.filter((r) => ['PENDING', 'IN_PROGRESS'].includes(r.status.toUpperCase())),
    [requests],
  );

  const resolveRequestType = (requestType: string): GdprRequestType | null => {
    return REQUEST_TYPE_MAP[requestType] ?? REQUEST_TYPE_MAP[requestType.toUpperCase()] ?? null;
  };

  const handleProcess = async (request: GdprDataRequest) => {
    const type = resolveRequestType(request.requestType);
    if (!type) {
      setProcessError('Unsupported request type for processing');
      return;
    }
    setProcessError(null);
    try {
      await processGdprRequest({ requestId: request.id, type }).unwrap();
      refetchRequests();
    } catch {
      setProcessError('Failed to process GDPR request');
    }
  };

  const handleExport = async (userId: string) => {
    setExportMessage(null);
    try {
      const data = await triggerExport(userId).unwrap();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gdpr-export-${userId}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage('Export downloaded successfully');
    } catch {
      setExportMessage('Failed to export user data');
    }
  };

  const btn = (variant: 'primary' | 'danger' | 'secondary'): React.CSSProperties => {
    const colors = { primary: t.orange, danger: t.red, secondary: t.gray };
    return {
      padding: '6px 12px',
      borderRadius: t.radius.sm,
      border: 'none',
      background: variant === 'secondary' ? t.grayLight : colors[variant],
      color: variant === 'secondary' ? t.black : t.white,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    };
  };

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={sectionTitleStyle}>GDPR Request Console</h3>
        <p style={{ fontSize: 13, color: t.gray, marginBottom: 16 }}>
          Search by customer user ID to review requests, process actions, export data, and view audit logs.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.gray, marginBottom: 4 }}>Select Customer</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setSearchUserId('');
              }}
              style={{ ...selectStyle, minWidth: 220 }}
              disabled={loadingCustomers}
            >
              <option value="">— Choose customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id.slice(-6)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.gray, marginBottom: 4 }}>Or enter User ID</label>
            <input
              value={searchUserId}
              onChange={(e) => {
                setSearchUserId(e.target.value);
                setSelectedUserId('');
              }}
              placeholder="User ID"
              style={{ ...selectStyle, padding: '8px 12px', width: 200 }}
            />
          </div>
          {activeUserId && (
            <button style={btn('secondary')} onClick={() => handleExport(activeUserId)} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export User Data'}
            </button>
          )}
        </div>

        {exportMessage && (
          <p style={{ marginTop: 12, fontSize: 13, color: exportMessage.includes('Failed') ? t.red : t.green }}>
            {exportMessage}
          </p>
        )}
        {processError && (
          <p style={{ marginTop: 12, fontSize: 13, color: t.red }}>{processError}</p>
        )}
      </div>

      {!activeUserId && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <p style={{ color: t.grayMuted }}>Select a customer to manage GDPR requests</p>
        </div>
      )}

      {activeUserId && (
        <>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h4 style={{ ...sectionTitleStyle, fontSize: 15 }}>
              Requests for {activeUserId} ({pendingRequests.length} pending)
            </h4>
            {loadingRequests && <p style={{ color: t.gray, padding: 16 }}>Loading requests...</p>}
            {!loadingRequests && requestsError && (
              <p style={{ color: t.red, padding: 16 }}>Failed to load GDPR requests</p>
            )}
            {!loadingRequests && !requestsError && requests.length === 0 && (
              <p style={{ color: t.grayMuted, padding: 16 }}>No GDPR requests for this user</p>
            )}
            {!loadingRequests && !requestsError && requests.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Type', 'Status', 'Created', 'Processed', 'Actions'].map((h) => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td style={tableCellStyle}>{request.requestType}</td>
                      <td style={tableCellStyle}>
                        <span style={statusBadge(request.status)}>{request.status}</span>
                      </td>
                      <td style={tableCellStyle}>{new Date(request.createdAt).toLocaleString()}</td>
                      <td style={tableCellStyle}>
                        {request.processedAt ? new Date(request.processedAt).toLocaleString() : '—'}
                      </td>
                      <td style={tableCellStyle}>
                        {['PENDING', 'IN_PROGRESS'].includes(request.status.toUpperCase()) ? (
                          <button
                            style={btn('primary')}
                            onClick={() => handleProcess(request)}
                            disabled={processing}
                          >
                            {processing ? 'Processing...' : 'Process'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: t.gray }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={cardStyle}>
            <h4 style={{ ...sectionTitleStyle, fontSize: 15 }}>Audit Log</h4>
            {loadingAudit && <p style={{ color: t.gray, padding: 16 }}>Loading audit log...</p>}
            {!loadingAudit && auditError && (
              <p style={{ color: t.red, padding: 16 }}>Failed to load audit log</p>
            )}
            {!loadingAudit && !auditError && auditLog.length === 0 && (
              <p style={{ color: t.grayMuted, padding: 16 }}>No audit entries for this user</p>
            )}
            {!loadingAudit && !auditError && auditLog.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Action', 'Details', 'Performed By', 'Timestamp'].map((h) => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td style={tableCellStyle}>{entry.action}</td>
                      <td style={tableCellStyle}>{entry.details || '—'}</td>
                      <td style={tableCellStyle}>{entry.performedBy || '—'}</td>
                      <td style={tableCellStyle}>{new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GdprManagerPage;