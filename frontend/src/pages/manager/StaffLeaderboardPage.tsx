import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
} from '@mui/material';
import { useState } from 'react';
import { useGetStaffLeaderboardQuery } from '../../store/api/analyticsApi';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function StaffLeaderboardPage() {
  const storeId = 'store-001'; // TODO: Get from auth context
  const [period, setPeriod] = useState('TODAY');

  const { data, isLoading, error } = useGetStaffLeaderboardQuery({ storeId, period });

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: string | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT':
        return 'success';
      case 'GOOD':
        return 'primary';
      case 'AVERAGE':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return 'transparent';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading leaderboard...</Typography>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">Failed to load leaderboard</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Staff Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Top performers for {data.period.toLowerCase()}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="TODAY">Today</ToggleButton>
          <ToggleButton value="WEEK">This Week</ToggleButton>
          <ToggleButton value="MONTH">This Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Staff Member</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell align="right">Avg Order Value</TableCell>
              <TableCell align="right">% of Total</TableCell>
              <TableCell align="center">Performance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rankings.map((staff) => (
              <TableRow
                key={staff.staffId}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: staff.rank <= 3 ? 'action.selected' : 'inherit',
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {staff.rank <= 3 && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: getMedalColor(staff.rank),
                        }}
                      >
                        <EmojiEventsIcon fontSize="small" />
                      </Avatar>
                    )}
                    <Typography variant="h6">{staff.rank}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {staff.staffName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {staff.staffId}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1">{staff.ordersProcessed}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(staff.salesGenerated)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(staff.averageOrderValue)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {staff.percentOfTotalSales.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={staff.performanceLevel.replace('_', ' ')}
                    color={getPerformanceColor(staff.performanceLevel) as any}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.rankings.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No staff performance data available for this period
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
