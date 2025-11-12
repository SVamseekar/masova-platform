import { Box, Container, Grid, Typography } from '@mui/material';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import RevenueBreakdownChart from '../../components/charts/RevenueBreakdownChart';
import PeakHoursHeatmap from '../../components/charts/PeakHoursHeatmap';

export default function AdvancedReportsPage() {
  const storeId = 'store-001'; // TODO: Get from auth context

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive analytics and insights for your restaurant
      </Typography>

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
    </Container>
  );
}
