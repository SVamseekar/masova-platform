import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useGetOrderTypeBreakdownQuery } from '../../store/api/analyticsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { normalizeOrderTypeBreakdown } from '../../utils/analyticsMetrics';
import { t, cardStyle, sectionTitleStyle } from '../../pages/manager/manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from '../../pages/manager/components';

const COLORS = [t.orange, t.blue, t.green, t.yellow];

interface RevenueBreakdownChartProps {
  storeId?: string;
}

export default function RevenueBreakdownChart({ storeId }: RevenueBreakdownChartProps) {
  const { data, isLoading, isError, refetch } = useGetOrderTypeBreakdownQuery(storeId);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const formatCurrency = (value: number) => formatMajorAmount(value, currency, locale);

  if (isLoading) {
    return (
      <div style={cardStyle} data-testid="revenue-breakdown-chart">
        <ManagerLoadingBlock rows={3} label="Loading revenue breakdown…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={cardStyle} data-testid="revenue-breakdown-chart">
        <ManagerErrorState title="Failed to load revenue breakdown" onRetry={() => void refetch()} />
      </div>
    );
  }

  const rows = normalizeOrderTypeBreakdown(data);
  if (!data || rows.length === 0) {
    return (
      <div style={cardStyle} data-testid="revenue-breakdown-chart">
        <ManagerEmptyState
          title="No order-type revenue yet"
          description="Breakdown appears after orders complete for this store."
        />
      </div>
    );
  }

  const chartData = rows.map((item) => ({
    name: item.label,
    value: item.sales,
    count: item.count,
    percentage: item.percentage,
  }));

  type ChartDatum = (typeof chartData)[number];

  return (
    <div style={cardStyle} data-testid="revenue-breakdown-chart">
      <div style={{ marginBottom: 12 }}>
        <h3 style={sectionTitleStyle}>Revenue by order type</h3>
        <div style={{ fontSize: 28, fontWeight: 700, color: t.black, marginTop: 8 }}>
          {formatCurrency(data.totalSales)}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: t.gray }}>
          {data.totalOrders} orders today
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => {
              const datum = entry as unknown as ChartDatum;
              return `${datum.name}: ${datum.percentage.toFixed(1)}%`;
            }}
            outerRadius={90}
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(typeof value === 'number' ? value : Number(value ?? 0))}
            contentStyle={{
              borderRadius: t.radius.md,
              border: `1px solid ${t.grayLight}`,
              fontFamily: t.font,
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {rows.map((item, index) => (
          <div key={item.orderType} style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: COLORS[index % COLORS.length],
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: t.black }}>{item.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: t.gray }}>
              {item.count} orders · {formatCurrency(item.averageOrderValue)} avg
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
