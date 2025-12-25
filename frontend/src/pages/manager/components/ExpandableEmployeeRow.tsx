import React, { useState, useMemo } from 'react';
import { colors, spacing, typography, borderRadius } from '../../../styles/design-tokens';

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
  employeeId,
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
  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

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
                ...(!(session.isActive === true || !session.logoutTime) ? styles.sessionRowCompleted : {}),
              }}
            >
              <div style={{
                ...styles.sessionNumber,
                ...((session.isActive === true || !session.logoutTime) ? {} : { background: colors.success.main }),
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
    marginBottom: spacing[3],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    background: colors.surface.elevated,
    boxShadow: '8px 8px 16px #d1d1d4, -8px -8px 16px #ffffff',
    transition: 'all 0.3s ease',
  },
  header: {
    padding: spacing[4],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'linear-gradient(145deg, #f5f5f8, #e8e8eb)',
  },
  headerExpanded: {
    borderBottom: `2px solid ${colors.surface.border}`,
    background: 'linear-gradient(145deg, #e8e8eb, #f5f5f8)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    transition: 'transform 0.3s ease',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: '20px',
    height: '20px',
    color: colors.text.secondary,
  },
  employeeName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  sessionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  stats: {
    display: 'flex',
    gap: spacing[6],
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    fontFamily: 'monospace',
  },
  expandedContent: {
    padding: spacing[4],
    background: colors.surface.background,
    animation: 'slideDown 0.3s ease',
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[3],
    marginBottom: spacing[3],
    borderRadius: borderRadius.md,
    background: '#ffffff',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.05)',
    border: `1px solid ${colors.surface.border}`,
    position: 'relative',
  },
  sessionRowWarning: {
    border: `2px solid ${colors.warning.main}`,
    background: '#fff9e6',
  },
  sessionRowCompleted: {
    opacity: 0.85,
    background: '#f9fafb',
  },
  sessionNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: colors.primary.main,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
    flexShrink: 0,
  },
  sessionDetails: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: spacing[3],
  },
  sessionDetailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  sessionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.medium,
  },
  sessionValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'monospace',
  },
  clockOutButton: {
    padding: `${spacing[2]} ${spacing[4]}`,
    background: colors.error.main,
    color: '#ffffff',
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '2px 2px 5px rgba(239, 68, 68, 0.3)',
  },
  warningBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2]}`,
    background: colors.warning.main,
    color: '#ffffff',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  warningIcon: {
    width: '14px',
    height: '14px',
  },
  statusBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  activeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[1]} ${spacing[3]}`,
    background: colors.success.main,
    color: '#ffffff',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  completedBadge: {
    padding: `${spacing[1]} ${spacing[3]}`,
    background: colors.text.secondary,
    color: '#ffffff',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ffffff',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
};
