import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetSalesTrendsQuery } from '../../store/api/analyticsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { t, cardStyle, sectionTitleStyle } from '../../pages/manager/manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from '../../pages/manager/components';

interface SalesTrendChartProps {
  storeId?: string;
}

export default function SalesTrendChart({ storeId }: SalesTrendChartProps) {
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const { data, isLoading, isError, refetch } = useGetSalesTrendsQuery({ period, storeId });
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const formatCurrency = (value: number) => formatMajorAmount(value, currency, locale);

  if (isLoading) {
    return (
      <div style={cardStyle} data-testid="sales-trend-chart">
        <ManagerLoadingBlock rows={4} label="Loading sales trends…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={cardStyle} data-testid="sales-trend-chart">
        <ManagerErrorState title="Failed to load sales trends" onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!data || !data.dataPoints?.length) {
    return (
      <div style={cardStyle} data-testid="sales-trend-chart">
        <ManagerEmptyState
          title="No sales trend data"
          description="Trends appear after completed orders land in analytics."
        />
      </div>
    );
  }

  const trendColor =
    data.trend === 'UP' ? t.green : data.trend === 'DOWN' ? t.red : t.yellow;

  return (
    <div style={cardStyle} data-testid="sales-trend-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={sectionTitleStyle}>Sales trend</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: t.black }}>{formatCurrency(data.totalSales)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: trendColor }}>
              {data.percentChangeFromPreviousPeriod >= 0 ? '+' : ''}
              {data.percentChangeFromPreviousPeriod.toFixed(1)}% vs previous
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: t.gray }}>
            {data.totalOrders} orders · Avg {formatCurrency(data.averageOrderValue)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['WEEKLY', 'MONTHLY'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px',
                borderRadius: t.radius.sm,
                border: 'none',
                cursor: 'pointer',
                fontFamily: t.font,
                fontSize: 12,
                fontWeight: 600,
                background: period === p ? t.orange : t.grayLight,
                color: period === p ? t.white : t.gray,
              }}
            >
              {p === 'WEEKLY' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.dataPoints}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.grayLight} />
          <XAxis dataKey="label" tick={{ fill: t.gray, fontSize: 11 }} />
          <YAxis yAxisId="sales" tick={{ fill: t.gray, fontSize: 11 }} />
          <YAxis yAxisId="orders" orientation="right" tick={{ fill: t.gray, fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value ?? 0);
              if (name === 'Sales') return formatCurrency(n);
              return n;
            }}
            contentStyle={{
              borderRadius: t.radius.md,
              border: `1px solid ${t.grayLight}`,
              fontFamily: t.font,
            }}
          />
          <Legend />
          <Line
            yAxisId="sales"
            type="monotone"
            dataKey="sales"
            stroke={t.orange}
            strokeWidth={2}
            name="Sales"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orderCount"
            stroke={t.green}
            strokeWidth={2}
            name="Orders"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
