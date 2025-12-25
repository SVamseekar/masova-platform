import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useGetStaffProfileQuery, useUpdateStaffProfileMutation } from '../../store/api/userApi';
import { useGetEmployeeSessionsQuery } from '../../store/api/sessionApi';
import { useGetEmployeeShiftsQuery } from '../../store/api/shiftApi';
import { useGetPosStaffPerformanceQuery } from '../../store/api/orderApi';
import { useGetStaffRatingQuery } from '../../store/api/reviewApi';

const StaffProfilePage: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !staffId || staffId === user?.id;
  const profileUserId = isOwnProfile ? user?.id : staffId;
  const isManager = user?.type === 'MANAGER' || user?.type === 'ASSISTANT_MANAGER';

  // State for tabs
  const [activeTab, setActiveTab] = useState(0);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  // State for edit profile modal
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Fetch staff profile
  const { data: staffProfile, isLoading: profileLoading, error: profileError } = useGetStaffProfileQuery(
    profileUserId || '',
    { skip: !profileUserId }
  );

  // Fetch working sessions (last 3 months by default)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const { data: sessions = [], isLoading: sessionsLoading } = useGetEmployeeSessionsQuery({
    employeeId: profileUserId || '',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    page,
    size: rowsPerPage,
  }, { skip: !profileUserId });

  // Fetch upcoming shifts (next 30 days)
  const futureStartDate = new Date();
  const futureEndDate = new Date();
  futureEndDate.setDate(futureEndDate.getDate() + 30);

  const { data: upcomingShifts = [], isLoading: shiftsLoading } = useGetEmployeeShiftsQuery({
    employeeId: profileUserId || '',
    startDate: futureStartDate.toISOString().split('T')[0],
    endDate: futureEndDate.toISOString().split('T')[0],
  }, { skip: !profileUserId });

  // Fetch POS staff performance (last 3 months)
  const { data: posPerformance, isLoading: posPerformanceLoading } = useGetPosStaffPerformanceQuery({
    staffId: profileUserId || '',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }, { skip: !profileUserId });

  // Fetch staff rating
  const { data: staffRating, isLoading: staffRatingLoading } = useGetStaffRatingQuery(
    profileUserId || '',
    { skip: !profileUserId }
  );

  // Update staff profile mutation
  const [updateStaffProfile, { isLoading: updating }] = useUpdateStaffProfileMutation();

  // Calculate stats from sessions
  const stats = useMemo(() => {
    if (!sessions.length) {
      return {
        totalHours: 0,
        avgHoursPerShift: 0,
        totalBreaks: 0,
        pendingApproval: 0,
      };
    }

    const totalHours = sessions.reduce((sum, session) => sum + (session.totalHours || 0), 0);
    const completedSessions = sessions.filter(s => !s.isActive && s.totalHours);
    const avgHoursPerShift = completedSessions.length > 0
      ? totalHours / completedSessions.length
      : 0;
    const totalBreaks = sessions.reduce((sum, session) => sum + (session.breakTime || 0), 0);
    const pendingApproval = sessions.filter(s => s.status === 'PENDING_APPROVAL').length;

    return {
      totalHours: totalHours.toFixed(2),
      avgHoursPerShift: avgHoursPerShift.toFixed(2),
      totalBreaks,
      pendingApproval,
    };
  }, [sessions]);

  // Handle edit profile
  const handleOpenEditModal = () => {
    if (staffProfile) {
      setEditFormData({
        name: staffProfile.name || '',
        phone: staffProfile.phone || '',
        email: staffProfile.email || '',
      });
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
  };

  const handleSaveProfile = async () => {
    if (!profileUserId) return;

    try {
      await updateStaffProfile({
        userId: profileUserId,
        data: editFormData,
      }).unwrap();
      setOpenEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Format duration
  const formatDuration = (hours?: number) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Loading state
  if (profileLoading || sessionsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading staff profile...</Typography>
      </Container>
    );
  }

  // Error state
  if (profileError || !staffProfile) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Failed to load staff profile</Alert>
      </Container>
    );
  }

  // Get staff name parts for avatar initials
  const nameParts = staffProfile.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Back button for managers viewing staff profile */}
      {!isOwnProfile && isManager && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/staff')}
          sx={{ mb: 2 }}
        >
          Back to Staff Management
        </Button>
      )}

      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {initials}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {staffProfile.name || 'Staff Member'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Chip
                  label={staffProfile.type || 'STAFF'}
                  color="primary"
                  size="small"
                  icon={<WorkIcon />}
                />
                <Chip
                  label={staffProfile.isActive ? "Active" : "Inactive"}
                  color={staffProfile.isActive ? "success" : "default"}
                  size="small"
                />
                {staffProfile.role && (
                  <Chip
                    label={staffProfile.role}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(staffProfile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            {(isOwnProfile || isManager) && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenEditModal}
              >
                Edit Profile
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Profile & Sessions" />
          <Tab label="Schedule" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Profile & Sessions */}
      {activeTab === 0 && (
        <>
          {/* Personal Information */}
          <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Personal Information
          </Typography>
          <Divider sx={{ my: 2 }} />
          <List disablePadding>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Full Name"
                secondary={staffProfile.name || 'Not provided'}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={staffProfile.email}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PhoneIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Phone"
                secondary={staffProfile.phone || 'Not provided'}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BadgeIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Employee ID"
                secondary={staffProfile.id?.slice(-8).toUpperCase() || 'N/A'}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LocationOnIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Store ID"
                secondary={staffProfile.storeId || 'Not assigned'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Working Hours Statistics (Last 3 Months)
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {stats.totalHours}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Hours
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {sessions.filter(s => !s.isActive).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed Shifts
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {stats.avgHoursPerShift}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Hours/Shift
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {stats.totalBreaks}m
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Breaks
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {stats.pendingApproval > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {stats.pendingApproval} session(s) pending approval
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* POS Staff Performance */}
      {posPerformance && posPerformance.totalOrders > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              POS Performance (Last 3 Months)
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {posPerformance.totalOrders}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Orders Processed
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    ₹{posPerformance.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Revenue Generated
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    ₹{posPerformance.averageOrderValue.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Order Value
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {posPerformance.completedOrders}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed Orders
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Staff Rating */}
      {staffRating && staffRating.totalReviews > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Customer Ratings
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="h3" fontWeight="bold" color="primary.main">
                    {staffRating.averageRating.toFixed(1)}
                  </Typography>
                  <Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          sx={{
                            fontSize: 28,
                            color: star <= Math.round(staffRating.averageRating) ? 'warning.main' : 'action.disabled',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Based on {staffRating.totalReviews} review{staffRating.totalReviews !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <RateReviewIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {staffRating.totalReviews}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Reviews
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Working Session History */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Working Session History
          </Typography>
          <Divider sx={{ my: 2 }} />

          {sessions.length === 0 ? (
            <Alert severity="info">No working sessions found for the last 3 months</Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Clock In</strong></TableCell>
                      <TableCell><strong>Clock Out</strong></TableCell>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell><strong>Break</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {new Date(session.loginTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(session.loginTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          {session.logoutTime
                            ? new Date(session.logoutTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>{formatDuration(session.totalHours)}</TableCell>
                        <TableCell>{session.breakTime || 0}m</TableCell>
                        <TableCell>
                          <Chip
                            label={session.isActive ? 'Active' : session.status || 'Completed'}
                            color={session.isActive ? 'success' : session.status === 'PENDING_APPROVAL' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {sessions.length >= rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={Math.ceil(sessions.length / rowsPerPage) + 1}
                    page={page + 1}
                    onChange={(_, value) => setPage(value - 1)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Tab Panel 1: Schedule */}
      {activeTab === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Upcoming Schedule (Next 30 Days)
            </Typography>
            <Divider sx={{ my: 2 }} />

            {shiftsLoading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : upcomingShifts.length === 0 ? (
              <Alert severity="info">No upcoming shifts scheduled for the next 30 days</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Day</strong></TableCell>
                      <TableCell><strong>Start Time</strong></TableCell>
                      <TableCell><strong>End Time</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingShifts.map((shift) => {
                      const shiftStart = new Date(shift.scheduledStart);
                      const shiftEnd = new Date(shift.scheduledEnd);
                      const durationHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

                      return (
                        <TableRow key={shift.id}>
                          <TableCell>
                            {shiftStart.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            {shiftStart.toLocaleDateString('en-US', { weekday: 'long' })}
                          </TableCell>
                          <TableCell>
                            {shiftStart.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </TableCell>
                          <TableCell>
                            {shiftEnd.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={shift.type}
                              size="small"
                              color={
                                shift.type === 'OPENING' ? 'info' :
                                shift.type === 'CLOSING' ? 'warning' :
                                shift.type === 'PEAK' ? 'error' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {durationHours.toFixed(1)}h
                            {shift.isMandatory && (
                              <Chip label="Mandatory" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={shift.status}
                              size="small"
                              color={
                                shift.status === 'CONFIRMED' ? 'success' :
                                shift.status === 'IN_PROGRESS' ? 'warning' :
                                shift.status === 'COMPLETED' ? 'default' :
                                shift.status === 'CANCELLED' ? 'error' :
                                'info'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {upcomingShifts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  Total Hours Scheduled: <strong>{upcomingShifts.reduce((sum, shift) => {
                    const shiftStart = new Date(shift.scheduledStart);
                    const shiftEnd = new Date(shift.scheduledEnd);
                    return sum + (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h</strong>
                </Alert>
              </Box>
            )}

            {upcomingShifts.some(s => s.notes) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Shift Notes:
                </Typography>
                {upcomingShifts.filter(s => s.notes).map(shift => (
                  <Alert key={shift.id} severity="info" sx={{ mb: 1 }}>
                    <strong>{new Date(shift.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:</strong> {shift.notes}
                  </Alert>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              fullWidth
              required
              disabled={!isManager} // Only managers can change email
            />
            <TextField
              label="Phone"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={updating}>
            {updating ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffProfilePage;
