import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGetPeakHoursQuery } from '../../store/api/analyticsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import { formatMajorAmount } from '../../utils/currency';
import { activePeakHours } from '../../utils/analyticsMetrics';
import { t, cardStyle, sectionTitleStyle } from '../../pages/manager/manager-tokens';
import { ManagerEmptyState, ManagerErrorState, ManagerLoadingBlock } from '../../pages/manager/components';

interface PeakHoursHeatmapProps {
  storeId: string;
}

export default function PeakHoursHeatmap({ storeId }: PeakHoursHeatmapProps) {
  const { data, isLoading, isError, refetch } = useGetPeakHoursQuery(storeId);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const formatCurrency = (value: number) => formatMajorAmount(value, currency, locale);

  if (isLoading) {
    return (
      <div style={cardStyle} data-testid="peak-hours-chart">
        <ManagerLoadingBlock rows={3} label="Loading peak hours…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={cardStyle} data-testid="peak-hours-chart">
        <ManagerErrorState title="Failed to load peak hours" onRetry={() => void refetch()} />
      </div>
    );
  }

  const activeHours = activePeakHours(data);
  if (!data || activeHours.length === 0) {
    return (
      <div style={cardStyle} data-testid="peak-hours-chart">
        <ManagerEmptyState
          title="No peak-hour activity"
          description="Hourly distribution appears after orders are recorded for today."
        />
      </div>
    );
  }

  const getBarColor = (hour: number) => {
    if (hour === data.peakHour) return t.green;
    if (hour === data.slowestHour) return t.red;
    return t.blue;
  };

  const peakLabel = data.hourlyData?.[data.peakHour]?.label ?? `${data.peakHour}:00`;
  const slowLabel = data.hourlyData?.[data.slowestHour]?.label ?? `${data.slowestHour}:00`;

  return (
    <div style={cardStyle} data-testid="peak-hours-chart">
      <div style={{ marginBottom: 12 }}>
        <h3 style={sectionTitleStyle}>Peak hours</h3>
        <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: t.gray }}>Peak hour</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: t.green }}>{peakLabel}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: t.gray }}>
              {data.peakHourOrders} orders · {formatCurrency(data.peakHourSales)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: t.gray }}>Slowest hour</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: t.red }}>{slowLabel}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: t.gray }}>
              {data.hourlyData?.[data.slowestHour]?.orderCount ?? 0} orders
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={activeHours}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.grayLight} />
          <XAxis dataKey="label" angle={-35} textAnchor="end" height={70} tick={{ fill: t.gray, fontSize: 11 }} />
          <YAxis tick={{ fill: t.gray, fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value ?? 0);
              if (name === 'sales') return formatCurrency(n);
              return n;
            }}
            contentStyle={{
              borderRadius: t.radius.md,
              border: `1px solid ${t.grayLight}`,
              fontFamily: t.font,
            }}
          />
          <Bar dataKey="orderCount" name="Orders" radius={[6, 6, 0, 0]}>
            {activeHours.map((entry) => (
              <Cell key={entry.hour} fill={getBarColor(entry.hour)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: t.gray }}>
        <span><span style={{ color: t.green }}>■</span> Peak</span>
        <span><span style={{ color: t.blue }}>■</span> Normal</span>
        <span><span style={{ color: t.red }}>■</span> Slowest</span>
      </div>
    </div>
  );
}
