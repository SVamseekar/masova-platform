import React, { useState, useMemo, useCallback } from 'react';
import { t } from '../manager-tokens';

interface WorkingSession {
  id: string;
  employeeId: string;
  employeeName: string;
  loginTime: string;
  logoutTime?: string;
  breakDurationMinutes?: number;
  isActive: boolean;
}

interface ExpandableEmployeeRowProps {
  employeeName: string;
  employeeId: string;
  sessions: WorkingSession[];
  currentTime: Date;
  onClockOut?: (sessionId: string) => void;
}

export const ExpandableEmployeeRow: React.FC<ExpandableEmployeeRowProps> = ({
  employeeName,
  employeeId: _employeeId,
  sessions,
  currentTime,
  onClockOut,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort sessions by loginTime (most recent first)
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime();
    });
  }, [sessions]);

  // Format duration as HH:MM:SS - defined before use in useMemo
  const formatDuration = useCallback((ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    let totalWorkingMs = 0;
    let totalBreakMs = 0;
    let activeCount = 0;
    let completedCount = 0;

    sortedSessions.forEach(session => {
      const loginTime = new Date(session.loginTime).getTime();
      const logoutTime = session.logoutTime ? new Date(session.logoutTime).getTime() : currentTime.getTime();
      const sessionDuration = logoutTime - loginTime;
      const breakDuration = (session.breakDurationMinutes || 0) * 60 * 1000;

      totalWorkingMs += (sessionDuration - breakDuration);
      totalBreakMs += breakDuration;

      if (session.isActive) {
        activeCount++;
      } else {
        completedCount++;
      }
    });

    return {
      totalWorkingTime: formatDuration(totalWorkingMs),
      totalBreakTime: formatDuration(totalBreakMs),
      sessionCount: sortedSessions.length,
      activeCount,
      completedCount,
    };
  }, [sortedSessions, currentTime, formatDuration]);

  // Calculate individual session duration
  const getSessionDuration = (session: WorkingSession): string => {
    const loginTime = new Date(session.loginTime).getTime();
    const logoutTime = session.logoutTime ? new Date(session.logoutTime).getTime() : currentTime.getTime();
    const duration = logoutTime - loginTime;
    return formatDuration(duration);
  };

  // Get working time (excluding breaks)
  const getWorkingTime = (session: WorkingSession): string => {
    const loginTime = new Date(session.loginTime).getTime();
    const logoutTime = session.logoutTime ? new Date(session.logoutTime).getTime() : currentTime.getTime();
    const duration = logoutTime - loginTime;
    const breakDuration = (session.breakDurationMinutes || 0) * 60 * 1000;
    const workingTime = duration - breakDuration;
    return formatDuration(workingTime);
  };

  // Check if session duration exceeds 8 hours (warning)
  const isLongSession = (session: WorkingSession): boolean => {
    const loginTime = new Date(session.loginTime).getTime();
    const logoutTime = session.logoutTime ? new Date(session.logoutTime).getTime() : currentTime.getTime();
    const durationHours = (logoutTime - loginTime) / (1000 * 60 * 60);
    return durationHours > 8;
  };

  return (
    <div style={styles.container}>
      {/* Header - Always Visible */}
      <div
        style={{
          ...styles.header,
          ...(isExpanded ? styles.headerExpanded : {}),
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={styles.headerLeft}>
          {/* Expand/Collapse Icon */}
          <div
            style={{
              ...styles.iconContainer,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <svg style={styles.icon} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Employee Name & Session Count */}
          <div>
            <div style={styles.employeeName}>{employeeName}</div>
            <div style={styles.sessionCount}>
              {aggregateStats.sessionCount} session{aggregateStats.sessionCount > 1 ? 's' : ''}
              ({aggregateStats.activeCount} active, {aggregateStats.completedCount} completed)
            </div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Total Working:</span>
            <span style={styles.statValue}>{aggregateStats.totalWorkingTime}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Total Breaks:</span>
            <span style={styles.statValue}>{aggregateStats.totalBreakTime}</span>
          </div>
        </div>
      </div>

      {/* Expanded Content - Individual Sessions */}
      {isExpanded && (
        <div style={styles.expandedContent}>
          {sortedSessions.map((session, index) => (
            <div
              key={session.id}
              style={{
                ...styles.sessionRow,
                ...(isLongSession(session) ? styles.sessionRowWarning : {}),
                ...(!(session.isActive === true || !session.logoutTime) ? {} : {}),
              }}
            >
              <div style={{
                ...styles.sessionNumber,
                ...((session.isActive === true || !session.logoutTime) ? {} : { background: t.green }),
              }}>
                #{index + 1}
              </div>

              <div style={styles.sessionDetails}>
                <div style={styles.sessionDetailItem}>
                  <span style={styles.sessionLabel}>Login:</span>
                  <span style={styles.sessionValue}>
                    {new Date(session.loginTime).toLocaleTimeString()}
                  </span>
                </div>
                {session.logoutTime && (
                  <div style={styles.sessionDetailItem}>
                    <span style={styles.sessionLabel}>Logout:</span>
                    <span style={styles.sessionValue}>
                      {new Date(session.logoutTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <div style={styles.sessionDetailItem}>
                  <span style={styles.sessionLabel}>Duration:</span>
                  <span style={styles.sessionValue}>{getSessionDuration(session)}</span>
                </div>
                <div style={styles.sessionDetailItem}>
                  <span style={styles.sessionLabel}>Working Time:</span>
                  <span style={styles.sessionValue}>{getWorkingTime(session)}</span>
                </div>
                {session.breakDurationMinutes ? (
                  <div style={styles.sessionDetailItem}>
                    <span style={styles.sessionLabel}>Break:</span>
                    <span style={styles.sessionValue}>{session.breakDurationMinutes} min</span>
                  </div>
                ) : null}
              </div>

              {/* Status Badge */}
              <div style={styles.statusBadgeContainer}>
                {/* Check both isActive and logoutTime for accurate status */}
                {(session.isActive === true || !session.logoutTime) ? (
                  <div style={styles.activeBadge}>
                    <div style={styles.pulseDot}></div>
                    Active
                  </div>
                ) : (
                  <div style={styles.completedBadge}>
                    ✓ Completed
                  </div>
                )}
              </div>

              {/* Clock Out Button */}
              {onClockOut && (session.isActive === true || !session.logoutTime) && (
                <button
                  style={styles.clockOutButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClockOut(session.id);
                  }}
                >
                  Clock Out
                </button>
              )}

              {/* Long Session Warning */}
              {isLongSession(session) && (
                <div style={styles.warningBadge}>
                  <svg style={styles.warningIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {'>8 hours'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: 10,
    borderRadius: t.radius.md,
    overflow: 'hidden',
    background: t.white,
    border: `1px solid ${t.grayLight}`,
  },
  header: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    background: t.white,
  },
  headerExpanded: {
    borderBottom: `1px solid ${t.grayLight}`,
    background: t.bgMain,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  iconContainer: { transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center' },
  icon: { width: 18, height: 18, color: t.gray },
  employeeName: { fontSize: 14, fontWeight: 700, color: t.black, marginBottom: 2, fontFamily: t.font },
  sessionCount: { fontSize: 12, color: t.gray },
  stats: { display: 'flex', gap: 20 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  statLabel: { fontSize: 10, color: t.gray, marginBottom: 2, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: 700, color: t.orange, fontFamily: 'ui-monospace, monospace' },
  expandedContent: { padding: 12, background: t.bgMain },
  sessionRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: 10, marginBottom: 8,
    borderRadius: t.radius.sm, background: t.white, border: `1px solid ${t.grayLight}`, position: 'relative',
  },
  sessionRowWarning: { border: `1px solid ${t.yellow}`, background: '#FFFBEB' },
  sessionRowCompleted: { opacity: 0.9, background: t.white },
  sessionNumber: {
    width: 32, height: 32, borderRadius: '50%', background: t.orange, color: t.white,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0,
  },
  sessionDetails: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 },
  sessionDetailItem: { display: 'flex', flexDirection: 'column' },
  sessionLabel: { fontSize: 10, color: t.grayMuted, marginBottom: 2, textTransform: 'uppercase' },
  sessionValue: { fontSize: 13, color: t.black, fontWeight: 600, fontFamily: 'ui-monospace, monospace' },
  clockOutButton: {
    padding: '6px 12px', background: t.red, color: t.white, border: 'none', borderRadius: t.radius.sm,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: t.font,
  },
  warningBadge: {
    position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', background: t.yellow, color: t.black, borderRadius: 12, fontSize: 10, fontWeight: 700,
  },
  warningIcon: { width: 12, height: 12 },
  statusBadgeContainer: { display: 'flex', alignItems: 'center', marginLeft: 8 },
  activeBadge: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: t.green,
    color: t.white, borderRadius: 12, fontSize: 11, fontWeight: 700,
  },
  completedBadge: {
    padding: '3px 10px', background: t.grayLight, color: t.gray, borderRadius: 12, fontSize: 11, fontWeight: 700,
  },
  pulseDot: { width: 8, height: 8, borderRadius: '50%', background: t.white },
};
