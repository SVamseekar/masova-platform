import React, { useState, useMemo } from 'react';
import { t, cardStyle, tabStyle, tableHeaderStyle, tableCellStyle, sectionTitleStyle, selectStyle, statusBadge } from './manager-tokens';
import { format } from 'date-fns';

// Staff APIs
import {
  useGetStoreEmployeesQuery,
  useCreateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  type CreateUserRequest,
  type Address,
  type WorkSchedule,
} from '../../store/api/userApi';
import {
  useGetActiveStoreSessionsQuery,
  useGetStoreSessionsQuery,
  useGetEmployeeSessionReportQuery,
  useGetEmployeeSessionStatusQuery,
} from '../../store/api/sessionApi';

// Scheduling APIs
import {
  useGetWeeklyScheduleQuery,
  useBulkCreateShiftsMutation,
  useCopyPreviousWeekScheduleMutation,
  useDeleteShiftMutation,
  type Shift,
  type CreateShiftRequest,
} from '../../store/api/shiftApi';

// Leaderboard API
import { useGetStaffLeaderboardQuery } from '../../store/api/analyticsApi';

// Customer APIs
import {
  useGetAllCustomersQuery,
  useGetCustomerByIdQuery,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useAddNoteMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  Customer,
  type AddCustomerNoteRequest,
} from '../../store/api/customerApi';

// Campaign APIs
import {
  useGetAllCampaignsQuery,
  useExecuteCampaignMutation,
  useCancelCampaignMutation,
  useDeleteCampaignMutation,
  type Campaign,
  CampaignStatus,
} from '../../store/api/notificationApi';
import CampaignBuilder from '../../components/notifications/CampaignBuilder';

// Review APIs
import {
  useGetRecentReviewsQuery,
  useGetReviewsNeedingResponseQuery,
  useGetPendingReviewsQuery,
  useGetFlaggedReviewsQuery,
  useGetOverallStatsQuery,
  useCreateResponseMutation,
  useGetResponseTemplatesQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
  type Review,
  ResponseType,
} from '../../store/api/reviewApi';
import ReviewCard from '../../components/reviews/ReviewCard';

// Existing components
import { PINDisplayModal } from '../../components/modals/PINDisplayModal';
import { ExpandableEmployeeRow } from './components/ExpandableEmployeeRow';

interface Props { storeId: string; activeTab: string; onTabChange: (tab: string) => void; }

// ── shared styles ──
const miniStat: React.CSSProperties = { ...cardStyle, padding: 16, textAlign: 'center' as const };
const statLabel: React.CSSProperties = { fontSize: 12, color: t.gray, margin: 0 };
const statValue = (c?: string): React.CSSProperties => ({ fontSize: 24, fontWeight: 700, color: c || t.black, margin: '4px 0 0' });
const btn = (primary?: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  background: primary ? t.orange : t.grayLight, color: primary ? t.white : t.black,
});
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox: React.CSSProperties = { ...cardStyle, maxWidth: 640, width: '90%', maxHeight: '90vh', overflow: 'auto', padding: 28 };
const formGroup: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: t.gray };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${t.grayLight}`, borderRadius: 8, fontSize: 14, fontFamily: t.font, outline: 'none' };

// ── tabs ──
const tabs = [
  { id: 'staff', label: 'Staff' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'customers', label: 'Customers' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'reviews', label: 'Reviews' },
];

// =============================================
// STAFF TAB
// =============================================
const StaffTab = ({ storeId }: { storeId: string }) => {
  const { data: employees, isLoading } = useGetStoreEmployeesQuery(storeId, { skip: !storeId });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinData, setPinData] = useState<{ pin: string; employeeName: string; employeeType: string } | null>(null);

  // Session queries
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: allSessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useGetStoreSessionsQuery(
    { date: selectedDate }, { skip: !storeId, pollingInterval: 30000 }
  );
  const storeSessions = useMemo(() => allSessions.filter((s: any) => s.storeId === storeId), [allSessions, storeId]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const { data: employeeReport } = useGetEmployeeSessionReportQuery(
    { employeeId: selectedEmployeeId || '', startDate: '', endDate: '' }, { skip: !selectedEmployeeId }
  );
  const { data: employeeStatus } = useGetEmployeeSessionStatusQuery(selectedEmployeeId || '', {
    skip: !selectedEmployeeId, pollingInterval: 30000,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', userType: 'STAFF' as 'STAFF' | 'DRIVER' | 'ASSISTANT_MANAGER',
    role: 'Server', street: '', city: '', state: '', pincode: '', landmark: '', maxHoursPerWeek: 40,
    vehicleType: '', licenseNumber: '',
  });

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter((e: any) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      return true;
    });
  }, [employees, search, typeFilter]);

  const getDefaultPermissions = (userType: string): string[] => {
    switch (userType) {
      case 'DRIVER': return ['VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS', 'VIEW_DELIVERIES'];
      case 'ASSISTANT_MANAGER': return ['VIEW_ORDERS', 'CREATE_ORDERS', 'MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_STAFF'];
      default: return ['VIEW_ORDERS', 'CREATE_ORDERS', 'UPDATE_ORDER_STATUS'];
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) { alert('Please fill required fields'); return; }
    if (formData.password.length < 6) { alert('Password must be at least 6 characters'); return; }
    try {
      const address: Address | undefined = formData.street && formData.city && formData.state && formData.pincode
        ? { street: formData.street, city: formData.city, state: formData.state, pincode: formData.pincode, landmark: formData.landmark || undefined } : undefined;
      const schedule: WorkSchedule | undefined = formData.maxHoursPerWeek > 0 ? { maxHoursPerWeek: formData.maxHoursPerWeek } : undefined;
      const request: CreateUserRequest = {
        name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim(), password: formData.password,
        type: formData.userType, storeId, role: formData.role.trim(), address, permissions: getDefaultPermissions(formData.userType), schedule,
        ...(formData.userType === 'DRIVER' && { vehicleType: formData.vehicleType || undefined, licenseNumber: formData.licenseNumber || undefined }),
      };
      const result = await createUser(request).unwrap();
      setCreateOpen(false);
      if (result.generatedPIN) { setPinData({ pin: result.generatedPIN, employeeName: result.name, employeeType: result.type }); setPinModalOpen(true); }
      else { alert('Staff member created successfully!'); }
      setFormData({ name: '', email: '', phone: '', password: '', userType: 'STAFF', role: 'Server', street: '', city: '', state: '', pincode: '', landmark: '', maxHoursPerWeek: 40, vehicleType: '', licenseNumber: '' });
    } catch (err: any) { alert(err?.data?.message || 'Failed to create staff'); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      if (isActive) await deactivateUser(id).unwrap(); else await activateUser(id).unwrap();
    } catch (err: any) { alert(err?.data?.message || 'Failed to update status'); }
  };

  // Group sessions by date then employee
  const sessionsByDateAndEmployee = useMemo(() => {
    const byDate = new Map<string, typeof storeSessions>();
    storeSessions.forEach((s: any) => {
      const d = s.loginTime ? new Date(s.loginTime).toLocaleDateString('en-GB') : 'Unknown';
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(s);
    });
    const result = new Map<string, Map<string, typeof storeSessions>>();
    byDate.forEach((sessions, date) => {
      const empMap = new Map<string, typeof storeSessions>();
      sessions.forEach((s: any) => {
        const key = s.employeeId || s.employeeName || 'unknown';
        if (!empMap.has(key)) empMap.set(key, []);
        empMap.get(key)!.push(s);
      });
      result.set(date, empMap);
    });
    return result;
  }, [storeSessions]);

  const activeCount = storeSessions.filter((s: any) => s.isActive).length;
  const completedCount = storeSessions.filter((s: any) => !s.isActive).length;

  return (
    <>
      {pinData && <PINDisplayModal isOpen={pinModalOpen} onClose={() => { setPinModalOpen(false); setPinData(null); }} employeeName={pinData.employeeName} employeeType={pinData.employeeType} pin={pinData.pin} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={miniStat}><p style={statLabel}>Total</p><p style={statValue()}>{filtered.length}</p></div>
        <div style={miniStat}><p style={statLabel}>Active</p><p style={statValue(t.green)}>{filtered.filter((e: any) => e.isActive).length}</p></div>
        <div style={miniStat}><p style={statLabel}>Staff</p><p style={statValue(t.blue)}>{filtered.filter((e: any) => e.type === 'STAFF').length}</p></div>
        <div style={miniStat}><p style={statLabel}>Drivers</p><p style={statValue(t.orange)}>{filtered.filter((e: any) => e.type === 'DRIVER').length}</p></div>
      </div>

      {/* Filters + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...input, flex: 1, minWidth: 200 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          <option value="STAFF">Staff</option><option value="DRIVER">Driver</option><option value="ASSISTANT_MANAGER">Asst Manager</option><option value="MANAGER">Manager</option>
        </select>
        <button onClick={() => setCreateOpen(true)} style={btn(true)}>+ Add Staff</button>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Actions'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center' }}>Loading...</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center' }}>No staff found</td></tr>}
            {filtered.map((emp: any) => (
              <tr key={emp.id}>
                <td style={tableCellStyle}><span style={{ fontFamily: 'monospace', color: t.gray }}>{emp.id.slice(-4)}</span></td>
                <td style={tableCellStyle}><a href={`/manager/staff/${emp.id}/profile`} style={{ color: t.orange, fontWeight: 600, textDecoration: 'none' }}>{emp.name}</a></td>
                <td style={tableCellStyle}>{emp.email}</td>
                <td style={tableCellStyle}>{emp.phone || 'N/A'}</td>
                <td style={tableCellStyle}><span style={statusBadge(emp.type === 'MANAGER' ? t.orange : emp.type === 'DRIVER' ? t.yellow : t.green)}>{emp.type?.replace('_', ' ')}</span></td>
                <td style={tableCellStyle}><span style={statusBadge(emp.isActive ? t.green : t.red)}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedEmployeeId(emp.id)} style={btn()}>Report</button>
                    <button onClick={() => handleToggle(emp.id, emp.isActive)} style={{ ...btn(), background: emp.isActive ? t.red : t.green, color: t.white }}>{emp.isActive ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Report */}
      {selectedEmployeeId && (employeeReport || employeeStatus) && (
        <div style={{ ...cardStyle, marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={sectionTitleStyle}>Employee Report</h3>
            <button onClick={() => setSelectedEmployeeId(null)} style={btn()}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {employeeStatus && <div style={miniStat}><p style={statLabel}>Status</p><p style={statValue(employeeStatus.isActive ? t.green : t.gray)}>{employeeStatus.isActive ? 'Clocked In' : 'Clocked Out'}</p></div>}
            {employeeReport && <>
              <div style={miniStat}><p style={statLabel}>Sessions</p><p style={statValue()}>{employeeReport.length || 0}</p></div>
              <div style={miniStat}><p style={statLabel}>Total Hours</p><p style={statValue()}>{employeeReport.reduce((sum, s) => sum + (s.totalHours ?? 0), 0).toFixed(1)}h</p></div>
              <div style={miniStat}><p style={statLabel}>Avg Daily</p><p style={statValue()}>{employeeReport.length > 0 ? (employeeReport.reduce((sum, s) => sum + (s.totalHours ?? 0), 0) / employeeReport.length).toFixed(1) : '0.0'}h</p></div>
            </>}
          </div>
        </div>
      )}

      {/* Working Sessions */}
      <div style={{ ...cardStyle, marginTop: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={sectionTitleStyle}>Working Sessions</h3>
            <p style={{ fontSize: 12, color: t.gray, margin: '4px 0 0' }}>{storeSessions.length} sessions ({activeCount} active, {completedCount} completed)</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...input, width: 160 }} />
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={btn()}>Today</button>
            <button onClick={() => refetchSessions()} disabled={sessionsLoading} style={btn()}>{sessionsLoading ? 'Loading...' : 'Refresh'}</button>
          </div>
        </div>
        {sessionsLoading && <p style={{ textAlign: 'center', color: t.gray }}>Loading sessions...</p>}
        {!sessionsLoading && storeSessions.length === 0 && <p style={{ textAlign: 'center', color: t.gray }}>No sessions found</p>}
        {!sessionsLoading && storeSessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from(sessionsByDateAndEmployee.entries()).map(([date, empMap]) => (
              <div key={date} style={{ padding: 12, border: `1px solid ${t.grayLight}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${t.grayLight}` }}>
                  <div><h4 style={{ margin: 0, fontSize: 14, color: t.black }}>{date}</h4><p style={{ margin: '2px 0 0', fontSize: 12, color: t.gray }}>{empMap.size} employees</p></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={statusBadge(t.green)}>{Array.from(empMap.values()).flat().filter((s: any) => s.isActive).length} Active</span>
                    <span style={statusBadge(t.gray)}>{Array.from(empMap.values()).flat().filter((s: any) => !s.isActive).length} Done</span>
                  </div>
                </div>
                {Array.from(empMap.entries()).map(([key, sessions]) => (
                  <ExpandableEmployeeRow key={`${date}-${key}`} employeeName={(sessions[0] as any).employeeName || 'Unknown'} employeeId={(sessions[0] as any).employeeId || key} sessions={sessions} currentTime={currentTime} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {createOpen && (
        <div style={modalOverlay} onClick={() => setCreateOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 20 }}>Add New Staff Member</h3>
            <div style={formGroup}><label style={label}>Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={input} /></div>
            <div style={formGroup}><label style={label}>Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={input} /></div>
            <div style={formGroup}><label style={label}>Phone *</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={input} maxLength={10} /></div>
            <div style={formGroup}><label style={label}>Password *</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={input} /></div>
            <div style={formGroup}><label style={label}>Type *</label>
              <select value={formData.userType} onChange={e => setFormData({...formData, userType: e.target.value as any})} style={selectStyle}>
                <option value="STAFF">Staff</option><option value="DRIVER">Driver</option><option value="ASSISTANT_MANAGER">Asst Manager</option>
              </select>
            </div>
            <div style={formGroup}><label style={label}>Role</label><input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Server, Chef..." style={input} /></div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: t.black, margin: '16px 0 8px' }}>Address (Optional)</h4>
            <div style={formGroup}><label style={label}>Street</label><input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} style={input} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={formGroup}><label style={label}>City</label><input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={input} /></div>
              <div style={formGroup}><label style={label}>State</label><input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} style={input} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={formGroup}><label style={label}>PIN Code</label><input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} style={input} maxLength={6} /></div>
              <div style={formGroup}><label style={label}>Landmark</label><input value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} style={input} /></div>
            </div>
            <div style={formGroup}><label style={label}>Max Hours/Week</label><input type="number" value={formData.maxHoursPerWeek} onChange={e => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value) || 0})} style={input} min={0} max={80} /></div>
            {formData.userType === 'DRIVER' && <>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: t.black, margin: '16px 0 8px' }}>Driver Details</h4>
              <div style={formGroup}><label style={label}>Vehicle Type</label>
                <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} style={selectStyle}>
                  <option value="">Select</option><option value="Bike">Bike</option><option value="Scooter">Scooter</option><option value="Car">Car</option><option value="E-Bike">E-Bike</option>
                </select>
              </div>
              <div style={formGroup}><label style={label}>License Number</label><input value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value.toUpperCase()})} style={input} /></div>
            </>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setCreateOpen(false)} style={btn()}>Cancel</button>
              <button onClick={handleCreate} disabled={creating} style={btn(true)}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// SCHEDULING TAB
// =============================================
const getWeekStart = (d: Date): Date => { const n = new Date(d); const day = n.getDay(); n.setDate(n.getDate() - day + (day === 0 ? -6 : 1)); return n; };
const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const SchedulingTab = ({ storeId }: { storeId: string }) => {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', type: 'REGULAR' as string, date: fmtDate(new Date()), startTime: '09:00', endTime: '17:00', notes: '', isMandatory: true });

  const { data: shifts = [], isLoading: shiftsLoading } = useGetWeeklyScheduleQuery({ storeId, startDate: fmtDate(weekStart) }, { skip: !storeId });
  const { data: employees = [], isLoading: empLoading } = useGetStoreEmployeesQuery(storeId, { skip: !storeId });
  const [bulkCreate, { isLoading: creating }] = useBulkCreateShiftsMutation();
  const [copyPrev, { isLoading: copying }] = useCopyPreviousWeekScheduleMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const staff = useMemo(() => employees.filter((e: any) => ['STAFF', 'DRIVER', 'ASSISTANT_MANAGER'].includes(e.type)), [employees]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);

  const shiftGrid = useMemo(() => {
    const g: Record<string, Record<string, Shift[]>> = {};
    shifts.forEach((s: Shift) => {
      if (!g[s.employeeId]) g[s.employeeId] = {};
      const dk = fmtDate(new Date(s.scheduledStart));
      if (!g[s.employeeId][dk]) g[s.employeeId][dk] = [];
      g[s.employeeId][dk].push(s);
    });
    return g;
  }, [shifts]);

  const handleCreate = async () => {
    if (!formData.employeeId) { alert('Select an employee'); return; }
    try {
      const sd = new Date(formData.date); const [sh, sm] = formData.startTime.split(':'); const [eh, em] = formData.endTime.split(':');
      const start = new Date(sd); start.setHours(+sh, +sm, 0); const end = new Date(sd); end.setHours(+eh, +em, 0);
      await bulkCreate([{ storeId, employeeId: formData.employeeId, type: formData.type as any, scheduledStart: start.toISOString(), scheduledEnd: end.toISOString(), notes: formData.notes || undefined, isMandatory: formData.isMandatory }]).unwrap();
      setCreateOpen(false); alert('Shift created!');
    } catch (err: any) { alert(err?.data?.message || 'Failed'); }
  };

  const handleCopy = async () => { if (!confirm('Copy previous week?')) return; try { await copyPrev({ targetWeekStart: fmtDate(weekStart) }).unwrap(); alert('Copied!'); } catch (err: any) { alert('Failed'); } };
  const handleDelete = async (id: string) => { if (!confirm('Cancel this shift?')) return; try { await deleteShift(id).unwrap(); } catch { alert('Failed'); } };

  const shiftStatusColor = (s: string) => s === 'SCHEDULED' ? t.blue : s === 'CONFIRMED' ? t.green : s === 'IN_PROGRESS' ? t.yellow : s === 'MISSED' ? t.red : t.gray;

  return (
    <>
      {/* Week nav */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} style={btn()}>Previous</button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.black }}>Week of {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
          <button onClick={() => setWeekStart(getWeekStart(new Date()))} style={{ ...btn(), marginTop: 4, fontSize: 12 }}>Today</button>
        </div>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} style={btn()}>Next</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
        <button onClick={handleCopy} disabled={copying} style={btn()}>{copying ? 'Copying...' : 'Copy Previous Week'}</button>
        <button onClick={() => setCreateOpen(true)} style={btn(true)}>+ Create Shift</button>
      </div>

      {/* Schedule grid */}
      {shiftsLoading || empLoading ? <p style={{ textAlign: 'center', color: t.gray }}>Loading...</p> : staff.length === 0 ? <p style={{ textAlign: 'center', color: t.gray }}>No staff found</p> : (
        <div style={{ ...cardStyle, padding: 16, overflowX: 'auto' }}>
          <div style={{ minWidth: 1000 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${t.grayLight}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.black, padding: 8 }}>Employee</div>
              {weekDates.map(d => <div key={d.toISOString()} style={{ textAlign: 'center', padding: 8 }}><div style={{ fontSize: 12, fontWeight: 600, color: t.gray }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div><div style={{ fontSize: 16, fontWeight: 700, color: t.black }}>{d.getDate()}</div></div>)}
            </div>
            {/* Rows */}
            {staff.map((emp: any) => (
              <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: t.gray }}>{emp.role || emp.type}</div>
                </div>
                {weekDates.map(d => {
                  const dk = fmtDate(d); const s = shiftGrid[emp.id]?.[dk] || [];
                  return (
                    <div key={dk} style={{ padding: 6, background: t.bgMain, borderRadius: 8, minHeight: 60, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {s.length === 0 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.grayMuted, fontSize: 14 }}>-</div>
                        : s.map((shift: Shift) => (
                          <div key={shift.id} style={{ padding: 6, background: t.white, borderRadius: 6, borderLeft: `3px solid ${shiftStatusColor(shift.status)}`, position: 'relative', fontSize: 11 }}>
                            <div style={{ fontWeight: 600, color: t.black }}>{fmtTime(shift.scheduledStart)} - {fmtTime(shift.scheduledEnd)}</div>
                            <div style={{ color: t.gray }}>{shift.type}</div>
                            <button onClick={() => handleDelete(shift.id!)} style={{ position: 'absolute', top: 2, right: 2, background: t.red, color: t.white, border: 'none', borderRadius: 4, width: 16, height: 16, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Shift Modal */}
      {createOpen && (
        <div style={modalOverlay} onClick={() => setCreateOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 20 }}>Create New Shift</h3>
            <div style={formGroup}><label style={label}>Employee *</label>
              <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} style={selectStyle}>
                <option value="">Select</option>{staff.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.role || e.type})</option>)}
              </select>
            </div>
            <div style={formGroup}><label style={label}>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={selectStyle}>
                {['REGULAR','OPENING','CLOSING','PEAK','MAINTENANCE','TRAINING','EMERGENCY'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={formGroup}><label style={label}>Date *</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={input} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={formGroup}><label style={label}>Start</label><input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} style={input} /></div>
              <div style={formGroup}><label style={label}>End</label><input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} style={input} /></div>
            </div>
            <div style={formGroup}><label style={label}>Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ ...input, resize: 'vertical' }} rows={3} /></div>
            <div style={formGroup}><label style={{ ...label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={formData.isMandatory} onChange={e => setFormData({...formData, isMandatory: e.target.checked})} />Mandatory Shift</label></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setCreateOpen(false)} style={btn()}>Cancel</button>
              <button onClick={handleCreate} disabled={creating} style={btn(true)}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// LEADERBOARD TAB
// =============================================
const LeaderboardTab = ({ storeId }: { storeId: string }) => {
  const [period, setPeriod] = useState('TODAY');
  const { data, isLoading, error } = useGetStaffLeaderboardQuery({ storeId, period }, { skip: !storeId });

  const perfColor = (l: string) => l === 'EXCELLENT' ? t.green : l === 'GOOD' ? t.blue : l === 'AVERAGE' ? t.yellow : t.red;
  const medalColor = (r: number) => r === 1 ? '#FFD700' : r === 2 ? '#C0C0C0' : r === 3 ? '#CD7F32' : 'transparent';

  if (isLoading) return <p style={{ textAlign: 'center', color: t.gray }}>Loading leaderboard...</p>;
  if (error || !data) return <p style={{ textAlign: 'center', color: t.red }}>Failed to load leaderboard</p>;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['TODAY', 'WEEK', 'MONTH'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ ...btn(period === p), minWidth: 80 }}>{p === 'TODAY' ? 'Today' : p === 'WEEK' ? 'This Week' : 'This Month'}</button>
        ))}
      </div>

      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Rank', 'Staff Member', 'Orders', 'Sales', 'Avg Order', '% Total', 'Performance'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.rankings.length === 0 && <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center' }}>No data for this period</td></tr>}
            {data.rankings.map((s: any) => (
              <tr key={s.staffId} style={{ background: s.rank <= 3 ? `${t.orange}08` : 'transparent' }}>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.rank <= 3 && <span style={{ width: 28, height: 28, borderRadius: '50%', background: medalColor(s.rank), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>#{s.rank}</span>}
                    {s.rank > 3 && <span style={{ fontSize: 16, fontWeight: 700, color: t.black }}>{s.rank}</span>}
                  </div>
                </td>
                <td style={tableCellStyle}><div style={{ fontWeight: 600, color: t.black }}>{s.staffName}</div><div style={{ fontSize: 11, color: t.gray }}>ID: {s.staffId}</div></td>
                <td style={tableCellStyle}>{s.ordersProcessed}</td>
                <td style={{ ...tableCellStyle, fontWeight: 600 }}>Rs.{s.salesGenerated.toLocaleString()}</td>
                <td style={tableCellStyle}>Rs.{s.averageOrderValue.toFixed(0)}</td>
                <td style={tableCellStyle}>{s.percentOfTotalSales.toFixed(1)}%</td>
                <td style={tableCellStyle}><span style={statusBadge(perfColor(s.performanceLevel))}>{s.performanceLevel.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// =============================================
// CUSTOMERS TAB
// =============================================
const CustomersTab = ({ storeId }: { storeId: string }) => {
  const { data: allCustomers, isLoading } = useGetAllCustomersQuery(storeId, { pollingInterval: 30000 });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'GENERAL' | 'COMPLAINT' | 'PREFERENCE' | 'OTHER'>('GENERAL');
  const [detailTab, setDetailTab] = useState(0);

  const { data: selectedCustomer } = useGetCustomerByIdQuery(selectedId || '', { skip: !selectedId });
  const [deactivateCustomer] = useDeactivateCustomerMutation();
  const [activateCustomer] = useActivateCustomerMutation();
  const [addNote] = useAddNoteMutation();
  const [addAddress] = useAddAddressMutation();
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const filtered = useMemo(() => {
    if (!allCustomers) return [];
    if (!search) return allCustomers;
    const s = search.toLowerCase();
    return allCustomers.filter((c: any) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone?.includes(s));
  }, [allCustomers, search]);

  const handleToggle = async (c: Customer) => {
    try { if (c.active) await deactivateCustomer(c.id).unwrap(); else await activateCustomer(c.id).unwrap(); } catch { alert('Failed'); }
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return;
    try {
      await addNote({ customerId: selectedCustomer.id, data: { note: newNote, addedBy: 'Manager', category: noteCategory } as AddCustomerNoteRequest }).unwrap();
      setNewNote(''); setNoteOpen(false);
    } catch { alert('Failed'); }
  };

  const tierColor = (tier: string) => tier === 'PLATINUM' ? '#E5E4E2' : tier === 'GOLD' ? '#FFD700' : tier === 'SILVER' ? '#C0C0C0' : '#CD7F32';

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...input, flex: 1 }} />
      </div>

      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Name', 'Email', 'Phone', 'Tier', 'Orders', 'Spent', 'Status', 'Actions'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{ ...tableCellStyle, textAlign: 'center' }}>Loading...</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={8} style={{ ...tableCellStyle, textAlign: 'center' }}>No customers found</td></tr>}
            {filtered.map((c: any) => (
              <tr key={c.id}>
                <td style={tableCellStyle}>{c.name}</td>
                <td style={tableCellStyle}>{c.email}</td>
                <td style={tableCellStyle}>{c.phone || 'N/A'}</td>
                <td style={tableCellStyle}><span style={{ ...statusBadge(tierColor(c.loyaltyInfo?.tier)), color: '#000' }}>{c.loyaltyInfo?.tier || 'BRONZE'}</span></td>
                <td style={tableCellStyle}>{c.orderStats?.totalOrders ?? 0}</td>
                <td style={tableCellStyle}>Rs.{Math.round(c.orderStats?.totalSpent ?? 0)}</td>
                <td style={tableCellStyle}><span style={statusBadge(c.active ? t.green : t.red)}>{c.active ? 'Active' : 'Inactive'}</span></td>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelectedId(c.id); setDetailsOpen(true); setDetailTab(0); }} style={btn()}>View</button>
                    <button onClick={() => handleToggle(c)} style={{ ...btn(), background: c.active ? t.red : t.green, color: t.white }}>{c.active ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      {detailsOpen && selectedCustomer && (
        <div style={modalOverlay} onClick={() => setDetailsOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 8 }}>{selectedCustomer.name}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...statusBadge(tierColor(selectedCustomer.loyaltyInfo?.tier)), color: '#000' }}>{selectedCustomer.loyaltyInfo?.tier}</span>
                <span style={statusBadge(selectedCustomer.active ? t.green : t.red)}>{selectedCustomer.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Detail tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${t.grayLight}`, marginBottom: 16 }}>
              {['Profile', 'Loyalty', 'Addresses', 'Preferences', 'Notes'].map((tab, i) => (
                <button key={tab} onClick={() => setDetailTab(i)} style={{ padding: '8px 14px', border: 'none', borderBottom: detailTab === i ? `3px solid ${t.orange}` : '3px solid transparent', background: 'transparent', color: detailTab === i ? t.orange : t.gray, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{tab}</button>
              ))}
            </div>

            {detailTab === 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div><span style={{ fontSize: 12, color: t.gray }}>Email</span><div>{selectedCustomer.email}</div></div>
                <div><span style={{ fontSize: 12, color: t.gray }}>Phone</span><div>{selectedCustomer.phone}</div></div>
                <div><span style={{ fontSize: 12, color: t.gray }}>Member Since</span><div>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</div></div>
              </div>
            )}

            {detailTab === 1 && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div><span style={{ fontSize: 12, color: t.gray }}>Points</span><div style={{ fontSize: 22, fontWeight: 700, color: t.orange }}>{selectedCustomer.loyaltyInfo?.totalPoints}</div></div>
                <div><span style={{ fontSize: 12, color: t.gray }}>Orders</span><div style={{ fontSize: 22, fontWeight: 700, color: t.green }}>{selectedCustomer.orderStats?.totalOrders}</div></div>
                <div><span style={{ fontSize: 12, color: t.gray }}>Total Spent</span><div style={{ fontSize: 22, fontWeight: 700 }}>Rs.{Math.round(selectedCustomer.orderStats?.totalSpent ?? 0)}</div></div>
              </div>
            )}

            {detailTab === 2 && (
              <div>
                {selectedCustomer.addresses?.length === 0 ? <p style={{ color: t.gray }}>No addresses</p> : selectedCustomer.addresses?.map((a: any) => (
                  <div key={a.id} style={{ ...cardStyle, padding: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{a.label} {a.isDefault && <span style={statusBadge(t.orange)}>Default</span>}</div>
                    <div style={{ fontSize: 13, color: t.gray }}>{a.addressLine1}, {a.city}, {a.state} - {a.postalCode}</div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 3 && (
              <div>
                {selectedCustomer.preferences?.favoriteMenuItems?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: t.gray, marginBottom: 6 }}>Favorite Items</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedCustomer.preferences.favoriteMenuItems.map((item: string, i: number) => <span key={i} style={statusBadge(t.orange)}>{item}</span>)}
                    </div>
                  </div>
                )}
                <div><span style={{ fontSize: 12, color: t.gray }}>Spice Level</span><div>{selectedCustomer.preferences?.spiceLevel || 'Not set'}</div></div>
              </div>
            )}

            {detailTab === 4 && (
              <div>
                <button onClick={() => setNoteOpen(true)} style={{ ...btn(true), marginBottom: 12 }}>Add Note</button>
                {selectedCustomer.notes?.length === 0 ? <p style={{ color: t.gray }}>No notes</p> : selectedCustomer.notes?.map((n: any) => (
                  <div key={n.id} style={{ ...cardStyle, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}><span style={statusBadge(t.blue)}>{n.category}</span><span style={{ fontSize: 11, color: t.gray }}>by {n.addedBy} on {new Date(n.createdAt).toLocaleDateString()}</span></div>
                    <div style={{ fontSize: 13 }}>{n.note}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setDetailsOpen(false)} style={btn()}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteOpen && (
        <div style={modalOverlay} onClick={() => setNoteOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Add Note</h3>
            <div style={formGroup}><label style={label}>Category</label>
              <select value={noteCategory} onChange={e => setNoteCategory(e.target.value as any)} style={selectStyle}>
                <option value="GENERAL">General</option><option value="COMPLAINT">Complaint</option><option value="PREFERENCE">Preference</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div style={formGroup}><label style={label}>Note</label><textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={4} style={{ ...input, resize: 'vertical' }} placeholder="Enter note..." /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setNoteOpen(false)} style={btn()}>Cancel</button>
              <button onClick={handleAddNote} disabled={!newNote.trim()} style={btn(true)}>Add</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// CAMPAIGNS TAB
// =============================================
const CampaignsTab = ({ storeId }: { storeId: string }) => {
  const [subTab, setSubTab] = useState(0); // 0=All, 1=Draft, 2=Scheduled, 3=Sent
  const [page, setPage] = useState(0);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: campaignsData, isLoading, refetch } = useGetAllCampaignsQuery({ storeId, page, size: 20 }, { skip: !storeId });
  const [executeCampaign] = useExecuteCampaignMutation();
  const [cancelCampaign] = useCancelCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();

  const campaigns = campaignsData?.content || [];
  const filtered = campaigns.filter((c: Campaign) => {
    if (subTab === 1) return c.status === CampaignStatus.DRAFT;
    if (subTab === 2) return c.status === CampaignStatus.SCHEDULED;
    if (subTab === 3) return c.status === CampaignStatus.SENDING || c.status === CampaignStatus.SENT;
    return true;
  });

  const statusColor = (s: CampaignStatus) => s === CampaignStatus.DRAFT ? t.gray : s === CampaignStatus.SCHEDULED ? t.yellow : s === CampaignStatus.SENDING ? t.blue : s === CampaignStatus.SENT ? t.green : s === CampaignStatus.CANCELLED ? t.red : t.red;
  const channelColor = (c: string) => c === 'SMS' ? t.red : c === 'EMAIL' ? t.blue : c === 'PUSH' ? t.green : t.yellow;

  const handleExec = async (c: Campaign) => { try { await executeCampaign(c.id).unwrap(); refetch(); } catch { alert('Failed'); } };
  const handleCancel = async (c: Campaign) => { try { await cancelCampaign(c.id).unwrap(); refetch(); } catch { alert('Failed'); } };
  const handleDel = async (c: Campaign) => { if (!confirm(`Delete "${c.name}"?`)) return; try { await deleteCampaign(c.id).unwrap(); refetch(); } catch { alert('Failed'); } };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Drafts', 'Scheduled', 'Sent'].map((l, i) => (
            <button key={l} onClick={() => setSubTab(i)} style={btn(subTab === i)}>{l}</button>
          ))}
        </div>
        <button onClick={() => { setSelectedCampaign(null); setBuilderOpen(true); }} style={btn(true)}>+ New Campaign</button>
      </div>

      {isLoading ? <p style={{ textAlign: 'center', color: t.gray }}>Loading...</p> : (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Campaign', 'Channel', 'Status', 'Recipients', 'Success', 'Created', 'Actions'].map(h => <th key={h} style={tableHeaderStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center' }}>No campaigns</td></tr>}
              {filtered.map((c: Campaign) => (
                <tr key={c.id}>
                  <td style={tableCellStyle}><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: t.gray }}>{c.description}</div></td>
                  <td style={tableCellStyle}><span style={statusBadge(channelColor(c.channel))}>{c.channel}</span></td>
                  <td style={tableCellStyle}><span style={statusBadge(statusColor(c.status))}>{c.status}</span></td>
                  <td style={tableCellStyle}>{c.totalRecipients || 0}</td>
                  <td style={tableCellStyle}>{c.sent > 0 ? `${((c.delivered / c.sent) * 100).toFixed(1)}%` : '-'}</td>
                  <td style={tableCellStyle}>{format(new Date(c.createdAt), 'MMM dd, yyyy')}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button onClick={() => { setSelectedCampaign(c); setViewOpen(true); }} style={btn()}>View</button>
                      {c.status === CampaignStatus.DRAFT && <>
                        <button onClick={() => { setSelectedCampaign(c); setBuilderOpen(true); }} style={btn()}>Edit</button>
                        <button onClick={() => handleExec(c)} style={btn(true)}>Execute</button>
                      </>}
                      {(c.status === CampaignStatus.SCHEDULED || c.status === CampaignStatus.SENDING) && <button onClick={() => handleCancel(c)} style={{ ...btn(), background: t.red, color: t.white }}>Cancel</button>}
                      {[CampaignStatus.DRAFT, CampaignStatus.CANCELLED, CampaignStatus.FAILED].includes(c.status) && <button onClick={() => handleDel(c)} style={{ ...btn(), background: t.red, color: t.white }}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaign Builder Modal */}
      {builderOpen && (
        <div style={modalOverlay} onClick={() => setBuilderOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <CampaignBuilder campaign={selectedCampaign} onClose={() => { setBuilderOpen(false); refetch(); }} />
          </div>
        </div>
      )}

      {/* View Campaign Modal */}
      {viewOpen && selectedCampaign && (
        <div style={modalOverlay} onClick={() => setViewOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Campaign Details</h3>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: t.black }}>{selectedCampaign.name}</h4>
            <p style={{ fontSize: 13, color: t.gray, marginBottom: 16 }}>{selectedCampaign.description}</p>
            {selectedCampaign.subject && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 12, color: t.gray }}>Subject:</span> {selectedCampaign.subject}</div>}
            {selectedCampaign.message && <div style={{ marginBottom: 16 }}><span style={{ fontSize: 12, color: t.gray }}>Message:</span> {selectedCampaign.message}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={miniStat}><p style={statLabel}>Recipients</p><p style={statValue()}>{selectedCampaign.totalRecipients || 0}</p></div>
              <div style={miniStat}><p style={statLabel}>Sent</p><p style={statValue()}>{selectedCampaign.sent}</p></div>
              <div style={miniStat}><p style={statLabel}>Delivered</p><p style={statValue(t.green)}>{selectedCampaign.delivered}</p></div>
              <div style={miniStat}><p style={statLabel}>Failed</p><p style={statValue(t.red)}>{selectedCampaign.failed}</p></div>
              <div style={miniStat}><p style={statLabel}>Opened</p><p style={statValue(t.blue)}>{selectedCampaign.opened}</p></div>
              <div style={miniStat}><p style={statLabel}>Clicked</p><p style={statValue(t.orange)}>{selectedCampaign.clicked}</p></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => setViewOpen(false)} style={btn()}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// REVIEWS TAB
// =============================================
const ReviewsTab = ({ storeId }: { storeId: string }) => {
  const [subTab, setSubTab] = useState<'all' | 'needs-response' | 'pending' | 'flagged'>('all');
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseType | null>(null);
  const [responseOpen, setResponseOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: stats } = useGetOverallStatsQuery(storeId, { skip: !storeId });
  const { data: templates } = useGetResponseTemplatesQuery();

  const { data: allReviews, isLoading: allLoading } = useGetRecentReviewsQuery({ storeId, page, size: 20 }, { skip: subTab !== 'all' || !storeId });
  const { data: needsResp, isLoading: nrLoading } = useGetReviewsNeedingResponseQuery({ storeId, page, size: 20 }, { skip: subTab !== 'needs-response' || !storeId });
  const { data: pendingR, isLoading: pLoading } = useGetPendingReviewsQuery({ storeId, page, size: 20 }, { skip: subTab !== 'pending' || !storeId });
  const { data: flaggedR, isLoading: fLoading } = useGetFlaggedReviewsQuery({ storeId, page, size: 20 }, { skip: subTab !== 'flagged' || !storeId });

  const [createResponse, { isLoading: submitting }] = useCreateResponseMutation();
  const [approveReview] = useApproveReviewMutation();
  const [rejectReview] = useRejectReviewMutation();

  const currentData = { all: allReviews, 'needs-response': needsResp, pending: pendingR, flagged: flaggedR }[subTab];
  const loading = { all: allLoading, 'needs-response': nrLoading, pending: pLoading, flagged: fLoading }[subTab];
  const reviews = currentData?.content || [];

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;
    try {
      await createResponse({ reviewId: selectedReview.id, request: { responseText, responseType: selectedTemplate || ResponseType.CUSTOM, isTemplate: !!selectedTemplate } }).unwrap();
      setResponseOpen(false); setSelectedReview(null); setResponseText('');
    } catch { alert('Failed'); }
  };

  const handleReject = async () => {
    if (!selectedReview || !rejectReason.trim()) return;
    try { await rejectReview({ reviewId: selectedReview.id, reason: rejectReason }).unwrap(); setRejectOpen(false); } catch { alert('Failed'); }
  };

  return (
    <>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={miniStat}><p style={statLabel}>Avg Rating</p><p style={statValue(t.yellow)}>{stats.averageRating?.toFixed(1) ?? '0.0'} / 5</p></div>
          <div style={miniStat}><p style={statLabel}>Total Reviews</p><p style={statValue(t.blue)}>{stats.totalReviews}</p></div>
          <div style={miniStat}><p style={statLabel}>Food Quality</p><p style={statValue(t.orange)}>{stats.averageFoodQualityRating?.toFixed(1) ?? '0.0'}</p></div>
          <div style={miniStat}><p style={statLabel}>Service</p><p style={statValue()}>{stats.averageServiceRating?.toFixed(1) ?? '0.0'}</p></div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ id: 'all' as const, l: 'All' }, { id: 'needs-response' as const, l: 'Needs Response' }, { id: 'pending' as const, l: 'Pending' }, { id: 'flagged' as const, l: 'Flagged' }].map(({ id, l }) => (
          <button key={id} onClick={() => { setSubTab(id); setPage(0); }} style={btn(subTab === id)}>{l}</button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? <p style={{ textAlign: 'center', color: t.gray }}>Loading...</p> : reviews.length === 0 ? <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}><p style={{ color: t.gray }}>No reviews in this category</p></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r: Review) => (
            <div key={r.id}>
              <ReviewCard review={r} showActions onReplyClick={() => { setSelectedReview(r); setResponseText(''); setSelectedTemplate(null); setResponseOpen(true); }} />
              {subTab === 'pending' && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <button onClick={() => approveReview(r.id)} style={btn(true)}>Approve</button>
                  <button onClick={() => { setSelectedReview(r); setRejectReason(''); setRejectOpen(true); }} style={{ ...btn(), background: t.red, color: t.white }}>Reject</button>
                </div>
              )}
            </div>
          ))}
          {currentData && currentData.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={btn()}>Previous</button>
              <span style={{ padding: '8px 12px', fontSize: 13 }}>Page {page + 1} of {currentData.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= currentData.totalPages - 1} style={btn()}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Response Modal */}
      {responseOpen && selectedReview && (
        <div style={modalOverlay} onClick={() => setResponseOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Respond to Review</h3>
            <div style={{ padding: 12, background: t.bgMain, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{selectedReview.customerName} - {selectedReview.overallRating}/5</div>
              <p style={{ fontSize: 13, color: t.gray, margin: '4px 0 0' }}>{selectedReview.comment}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Template (optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {Object.entries(ResponseType).map(([key, val]) => (
                  <button key={val} onClick={() => { setSelectedTemplate(val); if (templates?.[val]) setResponseText(templates[val]); }} style={{ ...btn(selectedTemplate === val), fontSize: 12 }}>{key.replace(/_/g, ' ')}</button>
                ))}
              </div>
            </div>
            <div style={formGroup}><label style={label}>Response *</label><textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={5} style={{ ...input, resize: 'vertical' }} placeholder="Write your response..." /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setResponseOpen(false)} style={btn()}>Cancel</button>
              <button onClick={handleSubmitResponse} disabled={!responseText.trim() || submitting} style={btn(true)}>{submitting ? 'Sending...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectOpen && selectedReview && (
        <div style={modalOverlay} onClick={() => setRejectOpen(false)}>
          <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Reject Review</h3>
            <div style={formGroup}><label style={label}>Reason *</label><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} style={{ ...input, resize: 'vertical' }} placeholder="Reason for rejection..." /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectOpen(false)} style={btn()}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} style={{ ...btn(), background: t.red, color: t.white }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// MAIN SECTION
// =============================================
const PeopleSection: React.FC<Props> = ({ storeId, activeTab, onTabChange }) => {
  const current = activeTab || 'staff';

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${t.grayLight}`, paddingBottom: 0 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => onTabChange(tab.id)} style={tabStyle(current === tab.id)}>
            {tab.label}
          </div>
        ))}
      </div>

      {current === 'staff' && <StaffTab storeId={storeId} />}
      {current === 'scheduling' && <SchedulingTab storeId={storeId} />}
      {current === 'leaderboard' && <LeaderboardTab storeId={storeId} />}
      {current === 'customers' && <CustomersTab storeId={storeId} />}
      {current === 'campaigns' && <CampaignsTab storeId={storeId} />}
      {current === 'reviews' && <ReviewsTab storeId={storeId} />}
    </div>
  );
};

export default PeopleSection;
