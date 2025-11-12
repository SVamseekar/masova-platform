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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useState } from 'react';
import { useGetTopProductsQuery } from '../../store/api/analyticsApi';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { createCard } from '../../styles/neumorphic-utils';
import { colors } from '../../styles/design-tokens';

export default function ProductAnalyticsPage() {
  const storeId = 'store-001'; // TODO: Get from auth context
  const [period, setPeriod] = useState('TODAY');
  const [sortBy, setSortBy] = useState('QUANTITY');

  const { data, isLoading, error } = useGetTopProductsQuery({ storeId, period, sortBy });

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: string | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, newSort: string | null) => {
    if (newSort) {
      setSortBy(newSort);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return <TrendingUpIcon fontSize="small" sx={{ color: colors.semantic.success }} />;
      case 'DOWN':
        return <TrendingDownIcon fontSize="small" sx={{ color: colors.semantic.error }} />;
      case 'NEW':
        return <NewReleasesIcon fontSize="small" sx={{ color: colors.brand.secondary }} />;
      default:
        return <TrendingFlatIcon fontSize="small" sx={{ color: colors.semantic.warning }} />;
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading product analytics...</Typography>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">Failed to load product analytics</Typography>
      </Container>
    );
  }

  const topProduct = data.topProducts[0];
  const totalRevenue = data.topProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalQuantity = data.topProducts.reduce((sum, p) => sum + p.quantitySold, 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Product Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Top selling items for {data.period.toLowerCase()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
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

          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={handleSortChange}
            size="small"
          >
            <ToggleButton value="QUANTITY">By Quantity</ToggleButton>
            <ToggleButton value="REVENUE">By Revenue</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...createCard('md', 'base') }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Top Seller
              </Typography>
              <Typography variant="h5" gutterBottom>
                {topProduct?.itemName || 'N/A'}
              </Typography>
              <Typography variant="body2">
                {topProduct?.quantitySold} sold • {formatCurrency(topProduct?.revenue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...createCard('md', 'base') }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Revenue (Top 20)
              </Typography>
              <Typography variant="h5" gutterBottom>
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography variant="body2">
                From {data.topProducts.length} products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...createCard('md', 'base') }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Items Sold (Top 20)
              </Typography>
              <Typography variant="h5" gutterBottom>
                {totalQuantity}
              </Typography>
              <Typography variant="body2">
                Across all categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Products Table */}
      <TableContainer component={Paper} sx={{ ...createCard('md', 'lg') }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Quantity Sold</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">% of Total</TableCell>
              <TableCell align="center">Trend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topProducts.map((product) => (
              <TableRow
                key={product.itemId}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: product.rank <= 3 ? 'action.selected' : 'inherit',
                }}
              >
                <TableCell>
                  <Typography
                    variant="h6"
                    color={product.rank <= 3 ? 'primary' : 'text.primary'}
                  >
                    {product.rank}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {product.itemName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {product.itemId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={product.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="medium">
                    {product.quantitySold}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(product.revenue)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(product.unitPrice)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {product.percentOfTotalRevenue.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {getTrendIcon(product.trend)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.topProducts.length === 0 && (
        <Paper sx={{ ...createCard('base', 'lg'), textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No product sales data available for this period
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
