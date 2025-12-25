import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import {
  useGetStoreEmployeesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  type CreateUserRequest,
  type Address,
  type WorkSchedule,
} from '../../store/api/userApi';
import { useGetActiveStoreSessionsQuery, useGetStoreSessionsQuery } from '../../store/api/sessionApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { FilterBar, type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';
import { PINDisplayModal } from '../../components/modals/PINDisplayModal';
import { ExpandableEmployeeRow } from './components/ExpandableEmployeeRow';

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'STAFF' | 'DRIVER' | 'ASSISTANT_MANAGER';
  role: string;
  // Address fields
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  // Schedule fields
  maxHoursPerWeek: number;
  // Driver-specific fields
  vehicleType: string;
  licenseNumber: string;
}

const StaffManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { handleBack } = useSmartBackNavigation();
  const { selectedStoreId } = usePageStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [generatedPinData, setGeneratedPinData] = useState<{
    pin: string;
    employeeName: string;
    employeeType: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    userType: 'STAFF',
    role: 'Server',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    maxHoursPerWeek: 40,
    vehicleType: '',
    licenseNumber: '',
  });

  // Filter and sort state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    userType: '',
    status: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });

  // Get storeId from page-specific context
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // API queries
  const { data: employees, isLoading } = useGetStoreEmployeesQuery(storeId, { skip: !storeId });

  // Fetch ALL sessions for selected date (active + completed) so we can see clocked out staff
  const {
    data: allSessions = [],
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useGetStoreSessionsQuery(
    { date: selectedDate },
    {
      skip: !storeId,
      pollingInterval: 30000, // Poll every 30 seconds for real-time updates
    }
  );

  // Filter to only show sessions from the selected store
  const storeSessions = useMemo(() => {
    return allSessions.filter(session => session.storeId === storeId);
  }, [allSessions, storeId]);
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  // Live timer state for HH:MM:SS display
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Group sessions by date, then by employee
  const sessionsByDateAndEmployee = useMemo(() => {
    // First group by date
    const byDate = new Map<string, typeof storeSessions>();

    storeSessions.forEach((session: any) => {
      // Use loginTime to determine the date, format as DD/MM/YYYY
      const sessionDate = session.loginTime ? formatDate(session.loginTime) : 'Unknown Date';
      if (!byDate.has(sessionDate)) {
        byDate.set(sessionDate, []);
      }
      byDate.get(sessionDate)!.push(session);
    });

    // Then group each date's sessions by employee
    const result = new Map<string, Map<string, typeof storeSessions>>();

    byDate.forEach((sessions, date) => {
      const employeeMap = new Map<string, typeof storeSessions>();
      sessions.forEach((session: any) => {
        const employeeKey = session.employeeId || session.employeeName || 'unknown';
        if (!employeeMap.has(employeeKey)) {
          employeeMap.set(employeeKey, []);
        }
        employeeMap.get(employeeKey)!.push(session);
      });
      result.set(date, employeeMap);
    });

    // Sort dates in descending order (most recent first)
    // Parse DD/MM/YYYY back to compare
    return new Map([...result.entries()].sort((a, b) => {
      const parseDate = (ddmmyyyy: string) => {
        if (ddmmyyyy === 'Unknown Date') return new Date(0);
        const [day, month, year] = ddmmyyyy.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      };
      return parseDate(b[0]).getTime() - parseDate(a[0]).getTime();
    }));
  }, [storeSessions]);

  // For backward compatibility - total unique employees across all dates
  const sessionsByEmployee = useMemo(() => {
    const grouped = new Map<string, typeof storeSessions>();
    storeSessions.forEach((session: any) => {
      const key = session.employeeId || session.employeeName || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(session);
    });
    return grouped;
  }, [storeSessions]);

  // Calculate active and completed session counts
  const activeSessionCount = storeSessions.filter(s => s.isActive).length;
  const completedSessionCount = storeSessions.filter(s => !s.isActive).length;

  const handleCreateStaff = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      alert('❌ Please fill in all required fields:\n• Name\n• Email\n• Phone\n• Password');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('❌ Invalid phone number!\n\nPhone must be:\n• Exactly 10 digits\n• Start with 6, 7, 8, or 9\n• No spaces or special characters\n\nExample: 9876543222');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      console.error('Email validation failed:', formData.email, 'Trimmed:', trimmedEmail);
      alert(`❌ Invalid email format!\n\nEmail entered: "${formData.email}"\nPlease enter a valid email address (e.g., praveen.kitchen@masova.com)`);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      alert('❌ Password too short!\n\nPassword must be at least 6 characters long.');
      return;
    }

    // Validate pincode if provided
    if (formData.pincode) {
      const pincodeRegex = /^[1-9][0-9]{5}$/;
      if (!pincodeRegex.test(formData.pincode)) {
        alert('❌ Invalid pincode!\n\nPincode must be:\n• Exactly 6 digits\n• Cannot start with 0\n\nExample: 500034');
        return;
      }
    }

    // Validate driver-specific fields
    if (formData.userType === 'DRIVER') {
      if (!formData.vehicleType) {
        alert('❌ Vehicle type is required for drivers!');
        return;
      }
      if (!formData.licenseNumber) {
        alert('❌ License number is required for drivers!');
        return;
      }
    }

    try {
      // Build address object if address fields are provided
      const address: Address | undefined = formData.street && formData.city && formData.state && formData.pincode
        ? {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            landmark: formData.landmark || undefined,
          }
        : undefined;

      // Build schedule object
      const schedule: WorkSchedule | undefined = formData.maxHoursPerWeek > 0
        ? {
            maxHoursPerWeek: formData.maxHoursPerWeek,
          }
        : undefined;

      // Get default permissions based on user type
      const permissions = getDefaultPermissions(formData.userType);

      const request: CreateUserRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        type: formData.userType,
        storeId: storeId, // Use the selected storeId from header, not currentUser's storeId
        role: formData.role.trim(),
        address,
        permissions,
        schedule,
        // Add driver-specific fields if user is a driver
        ...(formData.userType === 'DRIVER' && {
          vehicleType: formData.vehicleType || undefined,
          licenseNumber: formData.licenseNumber || undefined,
        }),
      };

      const result = await createUser(request).unwrap();

      setCreateDialogOpen(false);

      // Show PIN to manager if employee
      if (result.generatedPIN) {
        // Display PIN in professional modal
        setGeneratedPinData({
          pin: result.generatedPIN,
          employeeName: result.name,
          employeeType: result.type,
        });
        setPinModalOpen(true);
      } else {
        alert('Staff member created successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        userType: 'STAFF',
        role: 'Server',
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        maxHoursPerWeek: 40,
        vehicleType: '',
        licenseNumber: '',
      });
      alert('Staff member created successfully!');
    } catch (error: any) {
      console.error('Error creating staff:', error);

      // Extract validation errors from the response
      let errorMessage = 'Failed to create staff member';

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Check for specific validation errors
      if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
        errorMessage = '❌ Invalid phone number!\n\nPhone must be:\n• Exactly 10 digits\n• Start with 6, 7, 8, or 9\n• No spaces or special characters\n\nExample: 9876543222';
      } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        errorMessage = '❌ Invalid email format!\n\nPlease enter a valid email address.';
      } else if (errorMessage.includes('pincode') || errorMessage.includes('PIN')) {
        errorMessage = '❌ Invalid pincode!\n\nPincode must be:\n• Exactly 6 digits\n• Cannot start with 0\n\nExample: 500034';
      } else if (errorMessage.includes('password')) {
        errorMessage = '❌ Invalid password!\n\nPassword must be at least 6 characters long.';
      }

      alert(errorMessage);
    }
  };

  // Helper function to get default permissions based on user type
  const getDefaultPermissions = (userType: 'STAFF' | 'DRIVER' | 'ASSISTANT_MANAGER'): string[] => {
    switch (userType) {
      case 'DRIVER':
        return ['VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS', 'VIEW_DELIVERIES'];
      case 'ASSISTANT_MANAGER':
        return ['VIEW_ORDERS', 'CREATE_ORDERS', 'MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_STAFF'];
      case 'STAFF':
      default:
        return ['VIEW_ORDERS', 'CREATE_ORDERS', 'UPDATE_ORDER_STATUS'];
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      console.log(`Toggling user ${userId} - current isActive: ${isActive}`);
      if (isActive) {
        console.log('Deactivating user...');
        const result = await deactivateUser(userId).unwrap();
        console.log('Deactivation result:', result);
        alert('User deactivated successfully!');
      } else {
        console.log('Activating user...');
        const result = await activateUser(userId).unwrap();
        console.log('Activation result:', result);
        alert('User activated successfully!');
      }
    } catch (error: any) {
      console.error('Error toggling staff status:', error);
      alert(`Error: ${error?.data?.message || error?.message || 'Failed to update user status'}`);
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'MANAGER':
        return colors.primary.main;
      case 'ASSISTANT_MANAGER':
        return colors.info.main;
      case 'DRIVER':
        return colors.warning.main;
      default:
        return colors.success.main;
    }
  };

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
      label: 'Employee Type',
      field: 'userType',
      options: [
        { label: 'Staff', value: 'STAFF' },
        { label: 'Driver', value: 'DRIVER' },
        { label: 'Assistant Manager', value: 'ASSISTANT_MANAGER' },
        { label: 'Manager', value: 'MANAGER' },
      ],
    },
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const sortOptions = [
    { label: 'Name', field: 'name' },
    { label: 'Email', field: 'email' },
    { label: 'Type', field: 'type' },
    { label: 'Status', field: 'isActive' },
  ];

  // Apply filters and sorting
  const filteredAndSortedEmployees = useMemo(() => {
    if (!employees) return [];

    const filtered = applyFilters(employees, filterValues, {
      search: (employee, value) =>
        commonFilters.searchText(employee, value as string, ['name', 'email', 'phone']),
      userType: (employee, value) => employee.type === value,
      status: (employee, value) =>
        (value === 'active' && employee.isActive) ||
        (value === 'inactive' && !employee.isActive),
    });

    return applySort(filtered, sortConfig);
  }, [employees, filterValues, sortConfig]);

  const handleFilterChange = (field: string, value: string | string[] | { from?: string; to?: string }) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      userType: '',
      status: '',
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
      filteredAndSortedEmployees,
      'staff_members',
      [
        { label: 'Name', field: 'name' },
        { label: 'Email', field: 'email' },
        { label: 'Phone', field: 'phone' },
        { label: 'Type', field: 'type' },
        {
          label: 'Status',
          field: 'isActive',
          format: (value) => (value ? 'Active' : 'Inactive'),
        },
        {
          label: 'Role',
          field: 'role',
          format: (value) => value || 'N/A',
        },
      ]
    );
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

  const headerContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: colors.primary.main,
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
    backgroundColor: colors.surface.elevated,
    borderBottom: `2px solid ${colors.surface.border}`,
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
    borderBottom: `1px solid ${colors.surface.border}`,
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
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  };

  const formGroupStyles: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  };

  const inputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'base'),
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  };

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: spacing[10],
  };

  // Calculate stats (using filtered data)
  const totalStaff = filteredAndSortedEmployees.length;
  const activeStaff = filteredAndSortedEmployees.filter(e => e.isActive).length;
  const staffCount = filteredAndSortedEmployees.filter(e => e.type === 'STAFF').length;
  const driverCount = filteredAndSortedEmployees.filter(e => e.type === 'DRIVER').length;

  return (
    <>
      <AnimatedBackground variant="default" />

      {/* PIN Display Modal */}
      {generatedPinData && (
        <PINDisplayModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setGeneratedPinData(null);
          }}
          employeeName={generatedPinData.employeeName}
          employeeType={generatedPinData.employeeType}
          pin={generatedPinData.pin}
        />
      )}

      <div style={containerStyles}>
        <AppHeader title="Staff Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />

        <div>
          <div style={headerContainerStyles}>
            <div>
              <h1 style={titleStyles}>Staff Management</h1>
              <p style={subtitleStyles}>Manage store employees, drivers, and staff members</p>
            </div>
            <Button variant="primary" size="base" onClick={() => setCreateDialogOpen(true)}>
              + Add Staff Member
            </Button>
          </div>

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
            showExport={filteredAndSortedEmployees.length > 0}
          />

          {/* Statistics Cards */}
          <div style={statsGridStyles}>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{totalStaff}</div>
              <div style={statLabelStyles}>Total Employees</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.success.main }}>{activeStaff}</div>
              <div style={statLabelStyles}>Active</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.info.main }}>{staffCount}</div>
              <div style={statLabelStyles}>Staff Members</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.warning.main }}>{driverCount}</div>
              <div style={statLabelStyles}>Drivers</div>
            </div>
          </div>

          {/* Staff Table */}
          <div style={tableCardStyles}>
            <table style={tableStyles}>
              <thead style={tableHeaderStyles}>
                <tr>
                  <th style={tableHeaderCellStyles}>ID</th>
                  <th style={tableHeaderCellStyles}>Name</th>
                  <th style={tableHeaderCellStyles}>Email</th>
                  <th style={tableHeaderCellStyles}>Phone</th>
                  <th style={tableHeaderCellStyles}>Type</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} style={{ ...tableCellStyles, textAlign: 'center', padding: spacing[8] }}>
                      Loading staff...
                    </td>
                  </tr>
                )}
                {!isLoading && filteredAndSortedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tableCellStyles, textAlign: 'center', padding: spacing[8] }}>
                      {employees && employees.length > 0
                        ? 'No staff members match the current filters'
                        : 'No staff members found'}
                    </td>
                  </tr>
                )}
                {filteredAndSortedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td style={tableCellStyles}>
                      <span style={{ fontFamily: 'monospace', color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                        {employee.id.slice(-4)}
                      </span>
                    </td>
                    <td style={tableCellStyles}>
                      <a
                        href={`/manager/staff/${employee.id}/profile`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/manager/staff/${employee.id}/profile`;
                        }}
                        style={{
                          color: colors.primary.main,
                          textDecoration: 'none',
                          fontWeight: typography.fontWeight.semibold,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {employee.name}
                      </a>
                    </td>
                    <td style={tableCellStyles}>{employee.email}</td>
                    <td style={tableCellStyles}>{employee.phone || 'N/A'}</td>
                    <td style={tableCellStyles}>
                      <span style={badgeStyles(getUserTypeColor(employee.type))}>
                        {employee.type?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td style={tableCellStyles}>
                      <span style={badgeStyles(employee.isActive ? colors.success.main : colors.error.main)}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tableCellStyles}>
                      <button
                        onClick={() => handleToggleActive(employee.id, employee.isActive)}
                        style={{
                          padding: `${spacing[2]} ${spacing[4]}`,
                          borderRadius: borderRadius.md,
                          border: employee.isActive ? '2px solid #ef4444' : '2px solid #10b981',
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.bold,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: employee.isActive ? '#ef4444' : '#10b981',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          minWidth: '100px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.backgroundColor = employee.isActive ? '#dc2626' : '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.backgroundColor = employee.isActive ? '#ef4444' : '#10b981';
                        }}
                      >
                        {employee.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Working Sessions (Grouped by Date) */}
          <div style={{ ...tableCardStyles, marginTop: spacing[6], padding: spacing[6] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2], flexWrap: 'wrap', gap: spacing[3] }}>
              <div>
                <h2 style={{ ...titleStyles, fontSize: typography.fontSize.xl, margin: 0 }}>
                  Working Sessions
                </h2>
                <p style={{ ...subtitleStyles, margin: `${spacing[1]} 0 0 0` }}>
                  {storeSessions.length} total session{storeSessions.length !== 1 ? 's' : ''} ({activeSessionCount} active, {completedSessionCount} completed) from {sessionsByEmployee.size} employee{sessionsByEmployee.size !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
                {/* Date Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                  <label style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                  }}>
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      ...createNeumorphicSurface('inset', 'sm', 'base'),
                      padding: `${spacing[2]} ${spacing[3]}`,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      minWidth: '160px',
                    }}
                  />
                </div>

                {/* Quick Date Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                  <label style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                  }}>
                    Quick Select
                  </label>
                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <button
                      onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                      style={{
                        ...createCard('sm', 'sm'),
                        padding: `${spacing[2]} ${spacing[3]}`,
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: selectedDate === new Date().toISOString().split('T')[0] ? colors.primary.main : colors.text.secondary,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSelectedDate(yesterday.toISOString().split('T')[0]);
                      }}
                      style={{
                        ...createCard('sm', 'sm'),
                        padding: `${spacing[2]} ${spacing[3]}`,
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.secondary,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => refetchSessions()}
                  disabled={sessionsLoading}
                  style={{ alignSelf: 'flex-end', minWidth: '100px', padding: `${spacing[2]} ${spacing[4]}` }}
                >
                  {sessionsLoading ? 'Refreshing...' : '🔄 Refresh'}
                </Button>
              </div>
            </div>

            {sessionsLoading && (
              <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading sessions...</div>
            )}

            {!sessionsLoading && storeSessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: spacing[8], color: colors.text.tertiary }}>
                No sessions found. No staff members have clocked in yet.
              </div>
            )}

            {!sessionsLoading && storeSessions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                {Array.from(sessionsByDateAndEmployee.entries()).map(([date, employeeMap]) => {
                  // Calculate stats for this date
                  const dateSessions = Array.from(employeeMap.values()).flat();
                  const dateActiveCount = dateSessions.filter(s => s.isActive).length;
                  const dateCompletedCount = dateSessions.filter(s => !s.isActive).length;

                  return (
                    <div key={date} style={{
                      padding: spacing[4],
                      background: colors.surface.background,
                      borderRadius: borderRadius.lg,
                      border: `2px solid ${colors.surface.border}`,
                    }}>
                      {/* Date Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing[4],
                        paddingBottom: spacing[3],
                        borderBottom: `2px solid ${colors.surface.border}`,
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: typography.fontSize.lg,
                            fontWeight: typography.fontWeight.bold,
                            color: colors.text.primary,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                          }}>
                            {date}
                          </h3>
                          <p style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.secondary,
                            margin: `${spacing[1]} 0 0 0`,
                          }}>
                            {employeeMap.size} employee{employeeMap.size !== 1 ? 's' : ''} • {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: spacing[3] }}>
                          <div style={{
                            padding: `${spacing[1]} ${spacing[3]}`,
                            background: colors.success.main,
                            color: '#ffffff',
                            borderRadius: borderRadius.full,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                          }}>
                            {dateActiveCount} Active
                          </div>
                          <div style={{
                            padding: `${spacing[1]} ${spacing[3]}`,
                            background: colors.text.secondary,
                            color: '#ffffff',
                            borderRadius: borderRadius.full,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                          }}>
                            {dateCompletedCount} Completed
                          </div>
                        </div>
                      </div>

                      {/* Employee Rows for this Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                        {Array.from(employeeMap.entries()).map(([employeeKey, sessions]) => {
                          const firstSession = sessions[0];
                          const employeeName = firstSession.employeeName || 'Unknown Employee';
                          const employeeId = firstSession.employeeId || employeeKey;

                          return (
                            <ExpandableEmployeeRow
                              key={`${date}-${employeeKey}`}
                              employeeName={employeeName}
                              employeeId={employeeId}
                              sessions={sessions}
                              currentTime={currentTime}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Duration Explanation */}
            {!sessionsLoading && storeSessions.length > 0 && (
              <div style={{
                marginTop: spacing[4],
                padding: spacing[4],
                backgroundColor: colors.surface.elevated,
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                <strong>Duration Calculation:</strong> Working Duration = Current Duration - Break Time
                <br />
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Example: If an employee has been clocked in for 6 hours and taken 30 minutes break,
                  their working duration is 5h 30m.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      {createDialogOpen && (
        <div style={modalOverlayStyles} onClick={() => setCreateDialogOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
              Add New Staff Member
            </h2>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Full Name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyles}
              />
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Email *</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyles}
              />
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Phone *</label>
              <input
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyles}
                maxLength={10}
              />
              <small style={{ color: colors.text.secondary, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Must be 10 digits starting with 6, 7, 8, or 9 (e.g., 9876543222)
              </small>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Password *</label>
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={inputStyles}
              />
              <small style={{ color: colors.text.secondary, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Minimum 6 characters
              </small>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Employee Type *</label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
                style={selectStyles}
              >
                <option value="STAFF">Staff Member</option>
                <option value="DRIVER">Driver</option>
                <option value="ASSISTANT_MANAGER">Assistant Manager</option>
              </select>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Role</label>
              <input
                type="text"
                placeholder="e.g., Server, Chef, Delivery Driver"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={inputStyles}
              />
            </div>

            {/* Address Section */}
            <div style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
              <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                Address (Optional)
              </h3>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Street Address</label>
              <input
                type="text"
                placeholder="Enter street address"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                style={inputStyles}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <div style={formGroupStyles}>
                <label style={labelStyles}>City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={inputStyles}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
              <div style={formGroupStyles}>
                <label style={labelStyles}>PIN Code</label>
                <input
                  type="text"
                  placeholder="6-digit PIN"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  style={inputStyles}
                  maxLength={6}
                />
                <small style={{ color: colors.text.secondary, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  6 digits, cannot start with 0 (e.g., 500034)
                </small>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Landmark</label>
                <input
                  type="text"
                  placeholder="Nearby landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  style={inputStyles}
                />
              </div>
            </div>

            {/* Schedule Section */}
            <div style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
              <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                Work Schedule
              </h3>
            </div>

            <div style={formGroupStyles}>
              <label style={labelStyles}>Max Hours Per Week</label>
              <input
                type="number"
                placeholder="40"
                value={formData.maxHoursPerWeek}
                onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: parseInt(e.target.value) || 0 })}
                style={inputStyles}
                min={0}
                max={80}
              />
            </div>

            {/* Driver-specific fields */}
            {formData.userType === 'DRIVER' && (
              <>
                <div style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
                  <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                    Driver Details
                  </h3>
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    style={selectStyles}
                  >
                    <option value="">Select vehicle type</option>
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Car</option>
                    <option value="E-Bike">E-Bike</option>
                  </select>
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>License Number</label>
                  <input
                    type="text"
                    placeholder="Enter driver's license number"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                    style={inputStyles}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end', marginTop: spacing[6] }}>
              <Button variant="secondary" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateStaff} disabled={creating}>
                {creating ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default withPageStoreContext(StaffManagementPage, 'staff');
