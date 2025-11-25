import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetAllDriversQuery,
  useGetOnlineDriversQuery,
  useGetDriverStatsQuery,
  useGetDriverPerformanceQuery,
  useActivateDriverMutation,
  useDeactivateDriverMutation,
  Driver,
  DriverPerformance,
} from '../../store/api/driverApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';

const DriverManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'AVAILABLE'>('ALL');

  // API queries
  const { data: allDrivers, isLoading: loadingAll } = useGetAllDriversQuery();
  const { data: onlineDrivers } = useGetOnlineDriversQuery();
  const { data: stats } = useGetDriverStatsQuery();
  const { data: driverPerformance } = useGetDriverPerformanceQuery(
    { driverId: selectedDriver?.id || '' },
    { skip: !selectedDriver?.id }
  );

  // Mutations
  const [activateDriver] = useActivateDriverMutation();
  const [deactivateDriver] = useDeactivateDriverMutation();

  // Filter drivers
  const displayDrivers = allDrivers?.filter((driver) => {
    const matchesSearch =
      driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'ONLINE' && driver.isOnline) ||
      (filterStatus === 'OFFLINE' && !driver.isOnline) ||
      (filterStatus === 'AVAILABLE' && driver.isAvailable);

    return matchesSearch && matchesFilter;
  }) || [];

  const handleToggleActive = async (driver: Driver) => {
    try {
      if (driver.isAvailable) {
        await deactivateDriver(driver.id).unwrap();
      } else {
        await activateDriver(driver.id).unwrap();
      }
    } catch (error) {
      console.error('Error toggling driver status:', error);
    }
  };

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setDetailsOpen(true);
  };

  const getStatusColor = (driver: Driver) => {
    if (!driver.isAvailable) return colors.text.disabled;
    if (driver.isOnline) return colors.semantic.success;
    return colors.semantic.warning;
  };

  const getStatusText = (driver: Driver) => {
    if (!driver.isAvailable) return 'Inactive';
    if (driver.isOnline) return driver.activeDeliveryId ? 'Busy' : 'Online';
    return 'Offline';
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    textAlign: 'center',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.primary,
    marginBottom: spacing[1],
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const filterContainerStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[4],
    marginBottom: spacing[6],
    display: 'flex',
    gap: spacing[4],
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const searchInputStyles: React.CSSProperties = {
    flexGrow: 1,
    minWidth: '250px',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    ...createNeumorphicSurface('inset', 'sm', 'base'),
  };

  const filterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.text.inverse : colors.text.secondary,
    backgroundColor: isActive ? colors.brand.primary : 'transparent',
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...(isActive ? {} : createNeumorphicSurface('flat', 'sm', 'base')),
  });

  const tableCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: 0,
    overflow: 'hidden',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeaderStyles: React.CSSProperties = {
    backgroundColor: colors.surface.secondary,
    borderBottom: `2px solid ${colors.surface.tertiary}`,
  };

  const tableHeaderCellStyles: React.CSSProperties = {
    padding: spacing[4],
    textAlign: 'left',
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const tableCellStyles: React.CSSProperties = {
    padding: spacing[4],
    borderBottom: `1px solid ${colors.surface.tertiary}`,
    fontSize: typography.fontSize.sm,
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    ...createBadge(),
    backgroundColor: color,
    color: '#fff',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  });

  const modalOverlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const infoGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  };

  if (loadingAll) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader title="Driver Management" showBackButton={false} />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="Driver Management" showBackButton={false} />

        <h1 style={titleStyles}>Driver Management</h1>
        <p style={subtitleStyles}>Manage delivery drivers and monitor performance</p>

        {/* Stats Cards */}
        {stats && (
          <div style={statsGridStyles}>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{stats.totalDrivers}</div>
              <div style={statLabelStyles}>Total Drivers</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.success }}>{stats.onlineDrivers}</div>
              <div style={statLabelStyles}>Online Now</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.info }}>{stats.availableDrivers}</div>
              <div style={statLabelStyles}>Available</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.warning }}>{stats.busyDrivers}</div>
              <div style={statLabelStyles}>Busy</div>
            </div>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{stats.totalDeliveriesToday}</div>
              <div style={statLabelStyles}>Deliveries Today</div>
            </div>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{stats.averageDeliveryTime}m</div>
              <div style={statLabelStyles}>Avg Delivery Time</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={filterContainerStyles}>
          <input
            type="text"
            placeholder="Search drivers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyles}
          />

          <div style={{ display: 'flex', gap: spacing[2] }}>
            {(['ALL', 'ONLINE', 'OFFLINE', 'AVAILABLE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={filterButtonStyles(filterStatus === status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers Table */}
        <div style={tableCardStyles}>
          {displayDrivers.length === 0 ? (
            <div style={{ padding: spacing[8], textAlign: 'center', color: colors.text.tertiary }}>
              No drivers found. {searchQuery && 'Try adjusting your search.'}
            </div>
          ) : (
            <table style={tableStyles}>
              <thead style={tableHeaderStyles}>
                <tr>
                  <th style={tableHeaderCellStyles}>Driver</th>
                  <th style={tableHeaderCellStyles}>Contact</th>
                  <th style={tableHeaderCellStyles}>Vehicle</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Stats</th>
                  <th style={tableHeaderCellStyles}>Rating</th>
                  <th style={tableHeaderCellStyles}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tableCellStyles}>
                      <div style={{ fontWeight: typography.fontWeight.semibold }}>
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                        ID: {driver.id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div>{driver.email}</div>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                        {driver.phone}
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      {driver.vehicleType ? (
                        <>
                          <div>{driver.vehicleType}</div>
                          <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                            {driver.vehicleNumber}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: colors.text.tertiary }}>Not set</span>
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      <span style={badgeStyles(getStatusColor(driver))}>
                        {getStatusText(driver)}
                      </span>
                    </td>
                    <td style={tableCellStyles}>
                      <div>{driver.completedDeliveries} completed</div>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                        {driver.totalDeliveries} total
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                        <span>⭐</span>
                        <span style={{ fontWeight: typography.fontWeight.semibold }}>
                          {driver.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div style={{ display: 'flex', gap: spacing[2] }}>
                        <Button variant="secondary" size="sm" onClick={() => handleViewDetails(driver)}>
                          Details
                        </Button>
                        <Button
                          variant={driver.isAvailable ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleActive(driver)}
                        >
                          {driver.isAvailable ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Driver Details Modal */}
      {detailsOpen && selectedDriver && (
        <div style={modalOverlayStyles} onClick={() => setDetailsOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={sectionTitleStyles}>
              Driver Details: {selectedDriver.firstName} {selectedDriver.lastName}
            </h2>

            {/* Basic Info */}
            <div style={{ marginBottom: spacing[6] }}>
              <h3 style={{ ...sectionTitleStyles, fontSize: typography.fontSize.lg }}>Basic Information</h3>
              <div style={infoGridStyles}>
                <div>
                  <div style={infoLabelStyles}>Email</div>
                  <div style={infoValueStyles}>{selectedDriver.email}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Phone</div>
                  <div style={infoValueStyles}>{selectedDriver.phone}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Vehicle Type</div>
                  <div style={infoValueStyles}>{selectedDriver.vehicleType || 'Not set'}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Vehicle Number</div>
                  <div style={infoValueStyles}>{selectedDriver.vehicleNumber || 'Not set'}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>License Number</div>
                  <div style={infoValueStyles}>{selectedDriver.licenseNumber || 'Not set'}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Status</div>
                  <div style={infoValueStyles}>
                    <span style={badgeStyles(getStatusColor(selectedDriver))}>
                      {getStatusText(selectedDriver)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            {driverPerformance && (
              <div style={{ marginBottom: spacing[6] }}>
                <h3 style={{ ...sectionTitleStyles, fontSize: typography.fontSize.lg }}>Performance Metrics</h3>
                <div style={infoGridStyles}>
                  <div>
                    <div style={infoLabelStyles}>Total Deliveries</div>
                    <div style={infoValueStyles}>{driverPerformance.totalDeliveries}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Completed</div>
                    <div style={infoValueStyles}>{driverPerformance.completedDeliveries}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>On-Time Rate</div>
                    <div style={infoValueStyles}>{driverPerformance.onTimeDeliveryPercentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Avg Delivery Time</div>
                    <div style={infoValueStyles}>{driverPerformance.averageDeliveryTime}m</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Distance Covered</div>
                    <div style={infoValueStyles}>{driverPerformance.totalDistanceCovered.toFixed(1)}km</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Average Rating</div>
                    <div style={infoValueStyles}>⭐ {driverPerformance.averageRating.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Total Earnings</div>
                    <div style={infoValueStyles}>₹{driverPerformance.totalEarnings.toFixed(0)}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Today's Deliveries</div>
                    <div style={infoValueStyles}>{driverPerformance.todayDeliveries}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[3] }}>
              <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverManagementPage;
