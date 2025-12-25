import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
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
import { ManagerDriverTrackingMap } from '../../components/delivery/ManagerDriverTrackingMap';
import { FilterBar, type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';

const DriverManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';
  const { handleBack } = useSmartBackNavigation();

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trackingDriver, setTrackingDriver] = useState<Driver | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Filter and sort state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: '',
    availability: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });

  // API queries with polling for real-time updates
  const { data: allDrivers, isLoading: loadingAll } = useGetAllDriversQuery(storeId, {
    skip: !storeId,
    pollingInterval: 10000 // Poll every 10 seconds for real-time status updates
  });
  const { data: onlineDrivers } = useGetOnlineDriversQuery(storeId, {
    skip: !storeId,
    pollingInterval: 10000
  });
  const { data: stats } = useGetDriverStatsQuery(storeId, {
    skip: !storeId,
    pollingInterval: 15000 // Poll stats every 15 seconds
  });
  const { data: driverPerformance } = useGetDriverPerformanceQuery(
    { driverId: selectedDriver?.id || '' },
    { skip: !selectedDriver?.id }
  );

  // Mutations
  const [activateDriver] = useActivateDriverMutation();
  const [deactivateDriver] = useDeactivateDriverMutation();

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      label: 'Search',
      field: 'search',
      placeholder: 'Search by name, email, or phone...',
    },
    {
      type: 'select',
      label: 'Online Status',
      field: 'status',
      options: [
        { label: 'Online', value: 'online' },
        { label: 'Offline', value: 'offline' },
        { label: 'Busy', value: 'busy' },
      ],
    },
    {
      type: 'select',
      label: 'Availability',
      field: 'availability',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const sortOptions = [
    { label: 'Name', field: 'name' },
    { label: 'Email', field: 'email' },
    { label: 'Phone', field: 'phone' },
    { label: 'Status', field: 'isOnline' },
  ];

  // Apply filters and sorting
  const filteredAndSortedDrivers = useMemo(() => {
    if (!allDrivers) return [];

    const filtered = applyFilters(allDrivers, filterValues, {
      search: (driver, value) =>
        commonFilters.searchText(driver, value as string, ['name', 'email', 'phone']),
      status: (driver, value) => {
        if (value === 'online') return driver.isOnline && !driver.activeDeliveryId;
        if (value === 'offline') return !driver.isOnline;
        if (value === 'busy') return driver.isOnline && !!driver.activeDeliveryId;
        return true;
      },
      availability: (driver, value) =>
        (value === 'active' && driver.isActive) ||
        (value === 'inactive' && !driver.isActive),
    });

    return applySort(filtered, sortConfig);
  }, [allDrivers, filterValues, sortConfig]);

  const handleFilterChange = (field: string, value: string | string[] | { from?: string; to?: string }) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      status: '',
      availability: '',
    });
  };

  const handleSortChange = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    exportToCSV(
      filteredAndSortedDrivers,
      'drivers',
      [
        { label: 'Name', field: 'name' },
        { label: 'Email', field: 'email' },
        { label: 'Phone', field: 'phone' },
        {
          label: 'Status',
          field: 'isOnline',
          format: (value) => (value ? 'Online' : 'Offline'),
        },
        {
          label: 'Availability',
          field: 'isActive',
          format: (value) => (value ? 'Active' : 'Inactive'),
        },
        {
          label: 'Active Delivery',
          field: 'activeDeliveryId',
          format: (value) => value || 'None',
        },
      ]
    );
  };

  const handleToggleActive = async (driver: Driver) => {
    try {
      if (driver.isActive) {
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

  const handleTrackDriver = (driver: Driver) => {
    setTrackingDriver(driver);
    setTrackingOpen(true);
  };

  const getStatusColor = (driver: Driver) => {
    if (!driver.isActive) return colors.text.disabled;
    if (driver.isOnline) return colors.semantic.success;
    return colors.semantic.warning;
  };

  const getStatusText = (driver: Driver) => {
    if (!driver.isActive) return 'Inactive';
    if (driver.isOnline) return driver.activeDeliveryId ? 'Busy' : 'Online';
    return 'Offline';
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
    paddingTop: '80px',
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

  const badgeStyles = (color: string): React.CSSProperties => {
    const { backgroundColor: _, ...badgeBase } = createBadge();
    return {
      ...badgeBase,
      backgroundColor: color,
      color: '#fff',
      padding: `${spacing[1]} ${spacing[2]}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    };
  };

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
          <AppHeader title="Driver Management" showBackButton={true} onBack={handleBack} showManagerNav={true} storeSelectorContextKey="driver-management" />

          <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="Driver Management" showBackButton={true} onBack={handleBack} showManagerNav={true} storeSelectorContextKey="driver-management" />

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

        {/* Filter Bar */}
        <FilterBar
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          sortOptions={sortOptions}
          onExport={handleExport}
          showExport={filteredAndSortedDrivers.length > 0}
        />

        {/* Drivers Table */}
        <div style={tableCardStyles}>
          {filteredAndSortedDrivers.length === 0 ? (
            <div style={{ padding: spacing[8], textAlign: 'center', color: colors.text.tertiary }}>
              {allDrivers && allDrivers.length > 0
                ? 'No drivers match the current filters'
                : 'No drivers found'}
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
                {filteredAndSortedDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tableCellStyles}>
                      <div
                        onClick={() => driver.isOnline && handleTrackDriver(driver)}
                        style={{
                          fontWeight: typography.fontWeight.semibold,
                          cursor: driver.isOnline ? 'pointer' : 'default',
                          color: driver.isOnline ? colors.brand.primary : colors.text.primary,
                          textDecoration: driver.isOnline ? 'underline' : 'none',
                        }}
                        title={driver.isOnline ? 'Click to track live location' : 'Driver is offline'}
                      >
                        {driver.isOnline && '📍 '}
                        {driver.name}
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
                      <div>{driver.completedDeliveries || 0} completed</div>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                        {driver.totalDeliveries || 0} total
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                        <span>⭐</span>
                        <span style={{ fontWeight: typography.fontWeight.semibold }}>
                          {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        {driver.isOnline && (
                          <Button variant="primary" size="sm" onClick={() => handleTrackDriver(driver)}>
                            📍 Track Live
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => handleViewDetails(driver)}>
                          Details
                        </Button>
                        <Button
                          variant={driver.isActive ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleActive(driver)}
                        >
                          {driver.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Live Tracking Modal */}
      {trackingOpen && trackingDriver && (
        <ManagerDriverTrackingMap
          driver={trackingDriver}
          onClose={() => {
            setTrackingOpen(false);
            setTrackingDriver(null);
          }}
        />
      )}

      {/* Driver Details Modal */}
      {detailsOpen && selectedDriver && (
        <div style={modalOverlayStyles} onClick={() => setDetailsOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={sectionTitleStyles}>
              Driver Details: {selectedDriver.name}
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
                    <div style={infoValueStyles}>{driverPerformance.totalDeliveries || 0}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Completed</div>
                    <div style={infoValueStyles}>{driverPerformance.completedDeliveries || 0}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>On-Time Rate</div>
                    <div style={infoValueStyles}>{(driverPerformance.onTimeDeliveryPercentage || 0).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Avg Delivery Time</div>
                    <div style={infoValueStyles}>{driverPerformance.averageDeliveryTime || 0}m</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Distance Covered</div>
                    <div style={infoValueStyles}>{(driverPerformance.totalDistanceCovered || 0).toFixed(1)}km</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Average Rating</div>
                    <div style={infoValueStyles}>⭐ {(driverPerformance.averageRating || 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Total Earnings</div>
                    <div style={infoValueStyles}>₹{(driverPerformance.totalEarnings || 0).toFixed(0)}</div>
                  </div>
                  <div>
                    <div style={infoLabelStyles}>Today's Deliveries</div>
                    <div style={infoValueStyles}>{driverPerformance.todayDeliveries || 0}</div>
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

export default withPageStoreContext(DriverManagementPage, 'driver-management');
