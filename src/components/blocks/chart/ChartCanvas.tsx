'use client';

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { CountUp } from '../CountUp';
import { clsx } from '@/lib/clsx';

export type ChartType = 'bar' | 'bar-h' | 'line' | 'area' | 'pie' | 'donut' | 'stat';

export interface ChartCanvasProps {
  type: ChartType;
  /** headers[0] = category label; headers[1..] = numeric series names. */
  headers: string[];
  rows: (string | number)[][];
  onDark: boolean;
  showLegend: boolean;
  showGrid: boolean;
  /** Pixel height of the plot area. */
  height: number;
}

/**
 * Validated categorical palette from the data-viz skill (references/palette.md).
 * The same eight hues stepped for each surface — assigned in fixed order, never
 * cycled. Colour follows the series/category, not its rank.
 */
const PALETTE_LIGHT = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const PALETTE_DARK = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'];

/** Chart ink — recessive grid/axes, text in ink tokens (never a series colour). */
const INK_LIGHT = { text: '#52514e', muted: '#898781', grid: '#e1e0d9', surface: '#ffffff' };
const INK_DARK = { text: 'rgba(255,255,255,0.82)', muted: 'rgba(255,255,255,0.55)', grid: 'rgba(255,255,255,0.14)', surface: '#0f2947' };

function toNumber(v: string | number): number {
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Recharts renderer for the Chart block. Turns the {headers, rows} dataset into
 * the chosen chart form, honouring legend/grid/height and the block's surface
 * (light paper vs. navy). `stat` renders KPI tiles instead of a plot.
 */
export default function ChartCanvas({ type, headers, rows, onDark, showLegend, showGrid, height }: ChartCanvasProps) {
  const palette = onDark ? PALETTE_DARK : PALETTE_LIGHT;
  const ink = onDark ? INK_DARK : INK_LIGHT;

  const categoryKey = headers[0] || 'Category';
  const seriesKeys = headers.slice(1).map((h, i) => h || `Series ${i + 1}`);

  // Recharts wants an array of objects keyed by series name.
  const data = rows.map((row) => {
    const o: Record<string, string | number> = { [categoryKey]: String(row[0] ?? '') };
    seriesKeys.forEach((key, i) => { o[key] = toNumber(row[i + 1]); });
    return o;
  });

  // KPI tiles — one per row, big value + label. Reuses the StatStrip CountUp.
  if (type === 'stat') {
    return (
      <div className={clsx('grid gap-4', data.length <= 2 ? 'grid-cols-2' : data.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
        {data.map((d, i) => (
          <div
            key={i}
            className={clsx('rounded-2xl p-6 text-center', onDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white shadow-sm ring-1 ring-ink/5')}
          >
            <div className="text-4xl md:text-5xl tabular-nums" style={{ color: palette[i % palette.length] }}>
              <CountUp value={String(d[seriesKeys[0]] ?? 0)} />
            </div>
            <div className={clsx('mt-2 font-condensed uppercase tracking-wide text-sm', onDark ? 'text-white/70' : 'text-ink/60')}>
              {String(d[categoryKey])}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tooltipStyle = {
    background: ink.surface,
    border: `1px solid ${ink.grid}`,
    borderRadius: 8,
    fontSize: 12,
    color: ink.text,
  };
  const axisProps = { stroke: ink.muted, tick: { fill: ink.muted, fontSize: 12 } as const, tickLine: false };
  const legend = showLegend && (seriesKeys.length >= 2 || type === 'pie' || type === 'donut')
    ? <Legend wrapperStyle={{ fontSize: 12, color: ink.text }} />
    : null;

  const isPie = type === 'pie' || type === 'donut';

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'bar' || type === 'bar-h' ? (
        <BarChart data={data} layout={type === 'bar-h' ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          {showGrid && <CartesianGrid stroke={ink.grid} horizontal={type === 'bar'} vertical={type === 'bar-h'} />}
          {type === 'bar-h'
            ? (<><XAxis type="number" {...axisProps} /><YAxis type="category" dataKey={categoryKey} width={120} {...axisProps} /></>)
            : (<><XAxis dataKey={categoryKey} {...axisProps} /><YAxis {...axisProps} /></>)}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: ink.grid, opacity: 0.4 }} />
          {legend}
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={palette[i % palette.length]} radius={type === 'bar-h' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
          ))}
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          {showGrid && <CartesianGrid stroke={ink.grid} vertical={false} />}
          <XAxis dataKey={categoryKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {legend}
          {seriesKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      ) : type === 'area' ? (
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          {showGrid && <CartesianGrid stroke={ink.grid} vertical={false} />}
          <XAxis dataKey={categoryKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {legend}
          {seriesKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.18} strokeWidth={2} />
          ))}
        </AreaChart>
      ) : isPie ? (
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          {legend}
          <Pie
            data={data}
            dataKey={seriesKeys[0]}
            nameKey={categoryKey}
            innerRadius={type === 'donut' ? '55%' : 0}
            outerRadius="80%"
            paddingAngle={1}
            stroke={ink.surface}
            strokeWidth={2}
          >
            {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
          </Pie>
        </PieChart>
      ) : <div />}
    </ResponsiveContainer>
  );
}
