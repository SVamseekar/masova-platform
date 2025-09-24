import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useGetActiveStoreSessionsQuery, useApproveSessionMutation } from '../../store/api/sessionApi';
import { useGetSalesAnalyticsQuery } from '../../store/api/analyticsApi';
import { formatINR } from '../../utils/currency';
import { formatTime, getElapsedTime } from '../../utils/dateTime';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ManagerDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  
  // RTK Query hooks for data fetching
  const { 
    data: activeSessions = [], 
    isLoading: sessionsLoading,
    refetch: refetchSessions 
  } = useGetActiveStoreSessionsQuery(user?.storeId || '');
  
  const { 
    data: salesData,
    isLoading: salesLoading 
  } = useGetSalesAnalyticsQuery({ storeId: user?.storeId || '', period: 'today' });

  const [approveSession] = useApproveSessionMutation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApproveSession = async (sessionId: string) => {
    try {
      await approveSession(sessionId).unwrap();
      refetchSessions();
    } catch (error) {
      console.error('Failed to approve session:', error);
    }
  };

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Sales Statistics Cards */}
      <Grid item xs={12} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #e53e3e 0%, #ff6b6b 100%)',
          color: 'white',
          height: '140px'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>Today's Sales</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {salesData ? formatINR(salesData.todaySales) : formatINR(45000)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  +{salesData?.percentageChange || 18.4}% vs Last Year
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="text.secondary" gutterBottom>Yesterday's Sales</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {salesData ? formatINR(salesData.yesterdaySales) : formatINR(42000)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Previous day performance
                </Typography>
              </Box>
              <AnalyticsIcon color="primary" sx={{ fontSize: 48 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="text.secondary" gutterBottom>Weekly Total</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {salesData ? formatINR(salesData.weeklySales) : formatINR(280000)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7 days
                </Typography>
              </Box>
              <DashboardIcon color="primary" sx={{ fontSize: 48 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="text.secondary" gutterBottom>Active Staff</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {activeSessions.filter(s => s.status === 'ACTIVE').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently working
                </Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 48 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Active Sessions Overview */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Active Staff Sessions
            </Typography>
            <IconButton onClick={() => refetchSessions()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
          
          {sessionsLoading ? (
            <LinearProgress />
          ) : (
            <Grid container spacing={2}>
              {activeSessions
                .filter(session => session.status === 'ACTIVE')
                .map(session => (
                <Grid item xs={12} md={6} lg={4} key={session.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {session.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {session.name}
                          </Typography>
                          <Chip 
                            label={session.role} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Started: {formatTime(session.loginTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {session.currentDuration}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Break Time: {session.breakTime}min
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const StaffTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Staff Working Hours - {new Date().toLocaleDateString('en-IN')}
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Break Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {session.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {session.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.role} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatTime(session.loginTime)}</TableCell>
                    <TableCell>
                      {session.isActive ? session.currentDuration : `${session.totalHours}h`}
                    </TableCell>
                    <TableCell>{session.breakTime}m</TableCell>
                    <TableCell>
                      <Chip 
                        label={session.status.replace('_', ' ')}
                        size="small"
                        color={
                          session.status === 'ACTIVE' ? 'success' :
                          session.status === 'PENDING_APPROVAL' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {session.status === 'PENDING_APPROVAL' && (
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleApproveSession(session.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const AnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Weekly Sales Performance (INR)
          </Typography>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 2, mt: 2 }}>
            {[
              { day: 'Mon', value: 60, amount: 28000 },
              { day: 'Tue', value: 80, amount: 35000 },
              { day: 'Wed', value: 45, amount: 22000 },
              { day: 'Thu', value: 90, amount: 42000 },
              { day: 'Fri', value: 75, amount: 38000 },
              { day: 'Sat', value: 95, amount: 45000 },
              { day: 'Sun', value: 70, amount: 33000 }
            ].map((item) => (
              <Box key={item.day} sx={{ flex: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    height: `${item.value * 2}px`,
                    background: 'linear-gradient(to top, #e53e3e, #ff6b6b)',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    pt: 1,
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  {formatINR(item.amount)}
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {item.day}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Key Performance Indicators
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Avg Order Value', value: formatINR(485), change: '+12%', color: 'success' },
              { label: 'Orders Today', value: '127', change: '+8%', color: 'success' },
              { label: 'Avg Prep Time', value: '18 mins', change: '-2 mins', color: 'success' },
              { label: 'Kitchen Efficiency', value: '94%', change: '+3%', color: 'success' },
              { label: 'Staff Productivity', value: '8.2 orders/hr', change: '+0.5', color: 'success' },
              { label: 'Customer Rating', value: '4.8/5', change: '+0.2', color: 'success' }
            ].map((kpi, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.label}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                      {kpi.value}
                    </Typography>
                    <Chip 
                      label={kpi.change} 
                      size="small" 
                      color={kpi.color as any}
                      variant="outlined"
                    />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Manager Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-IN')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Overview" 
              iconPosition="start"
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Staff Sessions" 
              iconPosition="start"
            />
            <Tab 
              icon={<AnalyticsIcon />} 
              label="Analytics" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          <OverviewTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <StaffTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <AnalyticsTab />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default ManagerDashboard;