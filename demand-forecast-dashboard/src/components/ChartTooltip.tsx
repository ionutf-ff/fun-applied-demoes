import { formatMWh, formatDateFull, formatPercent, formatTemperature } from '@/lib/formatters';
import type { ChartDataPoint } from '@/types';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  onAnalyzeClick?: (point: ChartDataPoint) => void;
  showTemp?: boolean;
  showHumidity?: boolean;
  showWind?: boolean;
}

export function ChartTooltip({ active, payload, onAnalyzeClick, showTemp, showHumidity, showWind }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const hasActual = data.actual !== null;
  const hasPredicted = data.predicted !== null;

  let deviation: number | null = null;
  if (hasActual && hasPredicted) {
    deviation = ((data.actual! - data.predicted!) / data.predicted!) * 100;
  }

  return (
    <div className="bg-dashboard-card/95 backdrop-blur-sm border border-dashboard-border rounded-lg px-4 py-3 shadow-xl min-w-[220px]">
      <p className="text-white font-medium text-sm mb-2">{formatDateFull(data.date)}</p>

      <div className="space-y-1.5">
        {hasActual && (
          <div className="flex justify-between text-xs">
            <span className="text-dashboard-accent">Actual:</span>
            <span className="text-white font-medium">{formatMWh(data.actual!)}</span>
          </div>
        )}
        {hasPredicted && (
          <div className="flex justify-between text-xs">
            <span className="text-dashboard-predict">Predicted:</span>
            <span className="text-white font-medium">{formatMWh(data.predicted!)}</span>
          </div>
        )}
        {showTemp && data.temperature !== null && (
          <div className="flex justify-between text-xs">
            <span style={{ color: '#F97316' }}>Temperature:</span>
            <span className="text-white font-medium">{formatTemperature(data.temperature)}</span>
          </div>
        )}
        {showHumidity && data.humidity !== null && (
          <div className="flex justify-between text-xs">
            <span style={{ color: '#38BDF8' }}>Humidity:</span>
            <span className="text-white font-medium">{data.humidity}%</span>
          </div>
        )}
        {showWind && data.windSpeed !== null && (
          <div className="flex justify-between text-xs">
            <span style={{ color: '#A78BFA' }}>Wind Speed:</span>
            <span className="text-white font-medium">{data.windSpeed} mph</span>
          </div>
        )}
        {deviation !== null && (
          <div className="flex justify-between text-xs">
            <span className="text-dashboard-muted">Error:</span>
            <span className={`font-medium ${data.isOutlier ? 'text-dashboard-error' : 'text-dashboard-accent'}`}>
              {formatPercent(deviation)}
            </span>
          </div>
        )}
      </div>

      {data.isOutlier && hasActual && onAnalyzeClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAnalyzeClick(data);
          }}
          className="mt-2.5 text-xs text-dashboard-predict hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          Click to analyze this forecast error →
        </button>
      )}
    </div>
  );
}
