// src/apps/POSSystem/components/ActiveSessionsWidget.tsx
import React, { useState, useEffect } from 'react';
import { colors, shadows, spacing } from '../../../styles/design-tokens';
import Button from '../../../components/ui/neumorphic/Button';
import { useGetActiveStoreSessionsQuery, useClockOutEmployeeMutation } from '../../../store/api/sessionApi';
import { useAppSelector } from '../../../store/hooks';
import RecordBreakModal from './RecordBreakModal';

interface ActiveSessionsWidgetProps {
  storeId: string;
  onClockInClick: () => void;
}

const ActiveSessionsWidget: React.FC<ActiveSessionsWidgetProps> = ({ storeId, onClockInClick }) => {
  const { user } = useAppSelector((state) => state.auth);
  const isManager = user?.type === 'MANAGER' || user?.type === 'ASSISTANT_MANAGER';

  // Fetch active sessions
  const { data: activeSessions = [], refetch } = useGetActiveStoreSessionsQuery(storeId, {
    pollingInterval: 30000, // Poll every 30 seconds
    skip: !storeId,
  });

  const [clockOutEmployee, { isLoading: isClockingOut }] = useClockOutEmployeeMutation();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakEmployeeId, setBreakEmployeeId] = useState<string>('');
  const [breakEmployeeName, setBreakEmployeeName] = useState<string>('');

  const handleClockOut = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to clock out ${employeeName}?`)) {
      return;
    }

    setSelectedEmployeeId(employeeId);

    try {
      await clockOutEmployee({ employeeId }).unwrap();
      refetch(); // Refresh the list
    } catch (err: any) {
      alert(err?.data?.error || 'Failed to clock out employee');
    } finally {
      setSelectedEmployeeId(null);
    }
  };

  const handleRecordBreak = (employeeId: string, employeeName: string) => {
    setBreakEmployeeId(employeeId);
    setBreakEmployeeName(employeeName);
    setBreakModalOpen(true);
  };

  const handleBreakSuccess = () => {
    refetch(); // Refresh the sessions list
  };

  // Live timer state - updates every second for HH:MM:SS display
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for live HH:MM:SS display

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (loginTime: string) => {
    const start = new Date(loginTime);
    const diffMs = currentTime.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Active Sessions</h3>
          <p style={styles.subtitle}>{activeSessions.length} employee{activeSessions.length !== 1 ? 's' : ''} clocked in</p>
        </div>
        {isManager && (
          <Button variant="primary" onClick={onClockInClick} size="sm">
            + Clock In Staff
          </Button>
        )}
      </div>

      {activeSessions.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No employees clocked in</p>
          {isManager && (
            <p style={styles.emptyHint}>Click "Clock In Staff" to get started</p>
          )}
        </div>
      ) : (
        <div style={styles.sessionsList}>
          {activeSessions.map((session: any) => (
            <div key={session.id} style={styles.sessionCard}>
              <div style={styles.sessionInfo}>
                <div style={styles.employeeInfo}>
                  <div style={styles.avatar}>
                    {session.employeeName?.charAt(0).toUpperCase() || 'E'}
                  </div>
                  <div>
                    <div style={styles.employeeName}>{session.employeeName || 'Employee'}</div>
                    <div style={styles.employeeRole}>{session.role || 'Staff'}</div>
                  </div>
                </div>

                <div style={styles.sessionDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Clock In:</span>
                    <span style={styles.detailValue}>{formatTime(session.loginTime)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Duration:</span>
                    <span style={styles.durationValue}>{formatDuration(session.loginTime)}</span>
                  </div>
                  {(session.breakDurationMinutes || session.breakTime) > 0 && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Break:</span>
                      <span style={styles.breakValue}>{session.breakDurationMinutes || session.breakTime || 0} min</span>
                    </div>
                  )}
                </div>
              </div>

              {isManager && (
                <div style={{ display: 'flex', gap: spacing[2], flexDirection: 'column' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRecordBreak(session.employeeId, session.name)}
                  >
                    ⏱ Record Break
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleClockOut(session.employeeId, session.name)}
                    disabled={isClockingOut && selectedEmployeeId === session.employeeId}
                  >
                    {isClockingOut && selectedEmployeeId === session.employeeId
                      ? 'Clocking Out...'
                      : 'Clock Out'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Break Recording Modal */}
      {breakModalOpen && (
        <RecordBreakModal
          employeeId={breakEmployeeId}
          employeeName={breakEmployeeName}
          onClose={() => setBreakModalOpen(false)}
          onSuccess={handleBreakSuccess}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  widget: {
    backgroundColor: colors.surface.background,
    borderRadius: '12px',
    boxShadow: shadows.raised.sm,
    padding: spacing[5],
    marginBottom: spacing[5],
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: colors.text.primary,
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: colors.text.secondary,
  },
  emptyState: {
    textAlign: 'center',
    padding: spacing[6],
  },
  emptyText: {
    fontSize: '16px',
    color: colors.text.secondary,
    margin: 0,
  },
  emptyHint: {
    fontSize: '14px',
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  },
  sessionCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.surface.secondary,
    borderRadius: '8px',
    border: `1px solid ${colors.surface.border}`,
  },
  sessionInfo: {
    flex: 1,
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: colors.primary.main,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
  },
  employeeName: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.text.primary,
  },
  employeeRole: {
    fontSize: '13px',
    color: colors.text.secondary,
    marginTop: '2px',
  },
  sessionDetails: {
    display: 'flex',
    gap: spacing[5],
    marginLeft: '56px', // Align with name (avatar width + gap)
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '12px',
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.text.primary,
  },
  durationValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.primary.main,
  },
  breakValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.warning.main,
  },
};

export default ActiveSessionsWidget;
