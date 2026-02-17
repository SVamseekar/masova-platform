import { Box, Container, Grid, Typography } from '@mui/material';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import RevenueBreakdownChart from '../../components/charts/RevenueBreakdownChart';
import PeakHoursHeatmap from '../../components/charts/PeakHoursHeatmap';
import { colors } from '../../styles/design-tokens';
import AppHeader from '../../components/common/AppHeader';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import { usePageStore } from '../../contexts/PageStoreContext';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import ManagerMetricTemplate, { KPICardData } from './ManagerMetricTemplate';

function AdvancedReportsPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const { handleBack } = useSmartBackNavigation();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const reportKPIs: KPICardData[] = [
    { label: 'Sales Trend', value: '7-Day', sub: 'Weekly comparison', accentColor: '#e53e3e' },
    { label: 'Revenue Breakdown', value: 'By Type', sub: 'Dine-in / Delivery / Takeaway', accentColor: '#7B1FA2' },
    { label: 'Peak Hours', value: 'Heatmap', sub: 'Busiest time slots', accentColor: '#FF6B35' },
  ];

  return (
    <>
      <AppHeader title="Advanced Reports" showBackButton={true} onBack={handleBack} showManagerNav={true} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: colors.text.primary }}>
          Advanced Reports
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          Comprehensive analytics and insights for your restaurant
        </Typography>
      </Box>

      <ManagerMetricTemplate kpis={reportKPIs} />

      <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Sales Trend - Full Width */}
        <Grid item xs={12}>
          <SalesTrendChart storeId={storeId} />
        </Grid>

        {/* Revenue Breakdown and Peak Hours - Side by Side */}
        <Grid item xs={12} md={6}>
          <RevenueBreakdownChart storeId={storeId} />
        </Grid>

        <Grid item xs={12} md={6}>
          <PeakHoursHeatmap storeId={storeId} />
        </Grid>
      </Grid>
      </Box>
    </Container>
    </>
  );
}

export default withPageStoreContext(AdvancedReportsPage, 'advanced-reports');
