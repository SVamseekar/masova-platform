import React from 'react';
import { t } from './manager-tokens';

/** Step so that four intervals cover `value`, e.g. 920 → 250, giving ticks 0…1,000. */
export const niceStep = (value: number): number => {
  if (value <= 0) return 25;
  const raw = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((m) => raw <= m * magnitude) ?? 10) * magnitude;
};

export interface BarDatum {
  key: string | number;
  label: string;
  value: number;
  /** Text read by assistive technology and shown on hover. */
  title: string;
}

interface BarChartProps {
  data: BarDatum[];
  ariaLabel: string;
  formatAxis: (value: number) => string;
  /** Draw every n-th x label (default 2). */
  labelEvery?: number;
  /** Print the formatted value above each bar (used when there are few bars). */
  valueLabel?: (value: number) => string;
  verticalGrid?: boolean;
  height?: number;
  /** Drawing width in viewBox units; use a larger value for full-width charts so text keeps its size. */
  width?: number;
  color?: string;
}

/** Bar chart in the style of the approved manager boards: hairline grid, 4 intervals, teal bars. */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  ariaLabel,
  formatAxis,
  labelEvery = 2,
  valueLabel,
  verticalGrid = true,
  height = 230,
  width = 640,
  color = '#D94A22',
}) => {
  const step = niceStep(Math.max(0, ...data.map((d) => d.value)));
  const max = step * 4;
  const left = 56;
  const bottom = 28;
  const top = valueLabel ? 22 : 8;
  const plotH = height - bottom - top;
  const slot = (width - left - 8) / Math.max(data.length, 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={ariaLabel} style={{ display: 'block' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = top + plotH - (plotH * i) / 4;
        return (
          <g key={i}>
            <line x1={left} x2={width - 8} y1={y} y2={y} stroke="#E7E8E3" strokeWidth={1} />
            <text x={left - 10} y={y + 4} textAnchor="end" fontSize={12} fill={t.gray}>
              {formatAxis(step * i)}
            </text>
          </g>
        );
      })}
      {data.map((d, index) => {
        const x = left + index * slot;
        const barH = (d.value / max) * plotH;
        return (
          <g key={d.key}>
            {verticalGrid && <line x1={x} x2={x} y1={top} y2={top + plotH} stroke="#EEEFEA" strokeWidth={1} />}
            {d.value > 0 && (
              <rect x={x + slot * 0.2} y={top + plotH - barH} width={slot * 0.6} height={barH} rx={2} fill={color}>
                <title>{d.title}</title>
              </rect>
            )}
            {valueLabel && d.value > 0 && (
              <text x={x + slot / 2} y={top + plotH - barH - 6} textAnchor="middle" fontSize={11} fill={t.black}>
                {valueLabel(d.value)}
              </text>
            )}
            {index % labelEvery === 0 && (
              <text x={x + (labelEvery > 1 ? 0 : slot / 2)} y={height - 6} textAnchor="middle" fontSize={12} fill={t.gray}>
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      {verticalGrid && (
        <line x1={left + data.length * slot} x2={left + data.length * slot} y1={top} y2={top + plotH} stroke="#EEEFEA" strokeWidth={1} />
      )}
    </svg>
  );
};
