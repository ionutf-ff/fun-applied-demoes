import { useState, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { CHART_COLORS } from '@/constants';
import { formatMWhShort, formatDate } from '@/lib/formatters';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { ErrorMetrics } from './ErrorMetrics';
import type { ChartDataPoint, SelectedPoint } from '@/types';

const TODAY = '2026-02-13';

const WEATHER_COLORS = {
  temperature: '#F97316',
  humidity: '#38BDF8',
  windSpeed: '#A78BFA',
} as const;

interface DemandChartProps {
  data: ChartDataPoint[];
  metrics: { rmse: number; mae: number; maxError: number; overallErrorRate: number };
  onPointClick: (point: SelectedPoint) => void;
}

function toSelectedPoint(point: ChartDataPoint): SelectedPoint {
  return {
    date: point.date,
    actual: point.actual,
    predicted: point.predicted,
    temperature: point.temperature,
    isOutlier: point.isOutlier,
    deviationPercent:
      point.actual !== null && point.predicted !== null
        ? ((point.actual - point.predicted) / point.predicted) * 100
        : null,
  };
}

function PredictedDot(props: any) {
  const { cx, cy, payload, onPointClick } = props;
  if (!cx || !cy || !payload) return null;

  const predicted = payload.predictedPast ?? payload.predictedFuture;
  if (predicted === null || predicted === undefined) return null;

  const isOutlier = payload.isOutlier;
  const fill = isOutlier ? CHART_COLORS.outlier : CHART_COLORS.predicted;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onPointClick(toSelectedPoint(payload));
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      {isOutlier && (
        <circle cx={cx} cy={cy} r={9} fill={CHART_COLORS.outlier} opacity={0.2} />
      )}
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#0F1117" strokeWidth={2} />
    </g>
  );
}

interface WeatherToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}

function WeatherToggle({ checked, onChange, icon, label, color }: WeatherToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-md border border-dashboard-border transition-colors"
      style={{ borderColor: checked ? color + '66' : undefined }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? color : '#6B7280',
          backgroundColor: checked ? color : 'transparent',
        }}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {icon}
      <span className="text-xs text-gray-300 font-medium">{label}</span>
    </label>
  );
}

export function DemandChart({ data, metrics, onPointClick }: DemandChartProps) {
  const [showTemp, setShowTemp] = useState(false);
  const [showHumidity, setShowHumidity] = useState(false);
  const [showWind, setShowWind] = useState(false);

  const anyWeather = showTemp || showHumidity || showWind;

  const hasToday = data.some((d) => d.date === TODAY);
  const hasFuture = data.some((d) => d.isFuture);

  const handleTooltipAnalyze = useCallback(
    (chartPoint: ChartDataPoint) => {
      onPointClick(toSelectedPoint(chartPoint));
    },
    [onPointClick]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] text-dashboard-muted">
        No data available. Select filters and click Update.
      </div>
    );
  }

  return (
    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-6">
      {/* Header: title (left) | metrics + checkboxes (right) */}
      <div className="flex items-center justify-between" style={{ margin: '0.25rem 0.75rem 1rem 0.75rem' }}>
        <h2 className="text-lg font-semibold text-white">Forecast vs Actual Demand</h2>
        <div className="flex items-center gap-4">
          <ErrorMetrics
            rmse={metrics.rmse}
            mae={metrics.mae}
            maxError={metrics.maxError}
            overallErrorRate={metrics.overallErrorRate}
          />
          <div className="flex flex-col gap-1.5">
            <WeatherToggle
              checked={showTemp}
              onChange={setShowTemp}
              icon={<Thermometer className="w-3.5 h-3.5" style={{ color: WEATHER_COLORS.temperature }} />}
              label="Temperature"
              color={WEATHER_COLORS.temperature}
            />
            <WeatherToggle
              checked={showHumidity}
              onChange={setShowHumidity}
              icon={<Droplets className="w-3.5 h-3.5" style={{ color: WEATHER_COLORS.humidity }} />}
              label="Humidity"
              color={WEATHER_COLORS.humidity}
            />
            <WeatherToggle
              checked={showWind}
              onChange={setShowWind}
              icon={<Wind className="w-3.5 h-3.5" style={{ color: WEATHER_COLORS.windSpeed }} />}
              label="Wind Speed"
              color={WEATHER_COLORS.windSpeed}
            />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={480}>
        <ComposedChart data={data} margin={{ top: 20, right: anyWeather ? 60 : 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            stroke={CHART_COLORS.axis}
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
          />
          <YAxis
            yAxisId="demand"
            stroke={CHART_COLORS.axis}
            tickFormatter={formatMWhShort}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={['auto', 'auto']}
            padding={{ top: 20, bottom: 20 }}
          />

          {anyWeather && (
            <YAxis
              yAxisId="weather"
              orientation="right"
              stroke={CHART_COLORS.axis}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={45}
              domain={['auto', 'auto']}
              padding={{ top: 20, bottom: 20 }}
            />
          )}

          {/* Confidence bands */}
          <Line yAxisId="demand" dataKey="confidenceHigh" stroke={CHART_COLORS.confidenceBand} strokeDasharray="4 4" strokeWidth={1} dot={false} activeDot={false} name="+10% Band" connectNulls={false} />
          <Line yAxisId="demand" dataKey="confidenceLow" stroke={CHART_COLORS.confidenceBand} strokeDasharray="4 4" strokeWidth={1} dot={false} activeDot={false} name="-10% Band" connectNulls={false} />

          {/* Predicted demand - past (solid) */}
          <Line yAxisId="demand" dataKey="predictedPast" stroke={CHART_COLORS.predicted} strokeWidth={2.5} dot={<PredictedDot onPointClick={onPointClick} />} activeDot={false} name="Predicted (Past)" connectNulls={false} />

          {/* Predicted demand - future (dashed) */}
          {hasFuture && (
            <Line yAxisId="demand" dataKey="predictedFuture" stroke={CHART_COLORS.predicted} strokeWidth={2.5} strokeDasharray="6 4" dot={<PredictedDot onPointClick={onPointClick} />} activeDot={false} name="Predicted (Future)" connectNulls={false} />
          )}

          {/* Actual demand line */}
          <Line yAxisId="demand" dataKey="actual" stroke={CHART_COLORS.actual} strokeWidth={2.5} dot={false} activeDot={false} name="Actual Demand" connectNulls={false} />

          {/* Temperature - past (solid) */}
          {showTemp && (
            <Line yAxisId="weather" dataKey="temperaturePast" stroke={WEATHER_COLORS.temperature} strokeWidth={1.5} dot={{ r: 2, fill: WEATHER_COLORS.temperature, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.temperature }} name="Temperature" connectNulls={false} />
          )}
          {/* Temperature - future (dashed) */}
          {showTemp && hasFuture && (
            <Line yAxisId="weather" dataKey="temperatureFuture" stroke={WEATHER_COLORS.temperature} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: WEATHER_COLORS.temperature, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.temperature }} name="Temperature (Forecast)" connectNulls={false} />
          )}

          {/* Humidity - past (solid) */}
          {showHumidity && (
            <Line yAxisId="weather" dataKey="humidityPast" stroke={WEATHER_COLORS.humidity} strokeWidth={1.5} dot={{ r: 2, fill: WEATHER_COLORS.humidity, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.humidity }} name="Humidity" connectNulls={false} />
          )}
          {/* Humidity - future (dashed) */}
          {showHumidity && hasFuture && (
            <Line yAxisId="weather" dataKey="humidityFuture" stroke={WEATHER_COLORS.humidity} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: WEATHER_COLORS.humidity, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.humidity }} name="Humidity (Forecast)" connectNulls={false} />
          )}

          {/* Wind Speed - past (solid) */}
          {showWind && (
            <Line yAxisId="weather" dataKey="windSpeedPast" stroke={WEATHER_COLORS.windSpeed} strokeWidth={1.5} dot={{ r: 2, fill: WEATHER_COLORS.windSpeed, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.windSpeed }} name="Wind Speed" connectNulls={false} />
          )}
          {/* Wind Speed - future (dashed) */}
          {showWind && hasFuture && (
            <Line yAxisId="weather" dataKey="windSpeedFuture" stroke={WEATHER_COLORS.windSpeed} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: WEATHER_COLORS.windSpeed, stroke: '#0F1117', strokeWidth: 1 }} activeDot={{ r: 4, fill: WEATHER_COLORS.windSpeed }} name="Wind Speed (Forecast)" connectNulls={false} />
          )}

          {/* Today reference line */}
          {hasToday && (
            <ReferenceLine
              yAxisId="demand"
              x={TODAY}
              stroke={CHART_COLORS.todayLine}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Today',
                position: 'insideTopRight',
                fill: CHART_COLORS.todayLine,
                fontSize: 11,
                fontWeight: 600,
                dy: 8,
              }}
            />
          )}

          <Tooltip
            content={<ChartTooltip onAnalyzeClick={handleTooltipAnalyze} showTemp={showTemp} showHumidity={showHumidity} showWind={showWind} />}
            cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: '3 3' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <ChartLegend showTemp={showTemp} showHumidity={showHumidity} showWind={showWind} />
    </div>
  );
}
