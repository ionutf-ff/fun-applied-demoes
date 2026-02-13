import { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Thermometer, Zap, Brain } from 'lucide-react';
import { formatMWh, formatDateFull, formatPercent, formatTemperature } from '@/lib/formatters';
import type { SelectedPoint } from '@/types';

interface AnalysisPanelProps {
  point: SelectedPoint | null;
  explanation: string;
  explanationLoading: boolean;
  onClose: () => void;
}

export function AnalysisPanel({ point, explanation, explanationLoading, onClose }: AnalysisPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!point) return null;

  const isHigher = point.deviationPercent !== null && point.deviationPercent > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel — 50% screen width */}
      <div className="fixed top-0 right-0 h-full w-1/2 bg-dashboard-card border-l border-dashboard-border z-50 shadow-2xl overflow-y-auto animate-slide-in">
        <div style={{ padding: '1.25rem' }}>

          {/* Header — title left, date right, close button far right */}
          <div className="flex items-center justify-between" style={{ marginBottom: '6.25rem' }}>
            <h3 className="text-xl font-semibold text-white">Demand Analysis</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{formatDateFull(point.date)}</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dashboard-border transition-colors text-dashboard-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '6.25rem' }}>
            <MetricCard
              icon={<Zap className="w-5 h-5 text-dashboard-accent" />}
              label="Actual Demand"
              value={point.actual !== null ? formatMWh(point.actual) : 'N/A'}
              color="text-dashboard-accent"
            />
            <MetricCard
              icon={<Zap className="w-5 h-5 text-dashboard-predict" />}
              label="Predicted Demand"
              value={point.predicted !== null ? formatMWh(point.predicted) : 'N/A'}
              color="text-dashboard-predict"
            />
            <MetricCard
              icon={<Thermometer className="w-5 h-5 text-blue-400" />}
              label="Temperature"
              value={point.temperature !== null ? formatTemperature(point.temperature) : 'N/A'}
              color="text-blue-400"
            />
            <MetricCard
              icon={isHigher ? <TrendingUp className="w-5 h-5 text-dashboard-error" /> : <TrendingDown className="w-5 h-5 text-dashboard-warning" />}
              label="Deviation"
              value={point.deviationPercent !== null ? formatPercent(point.deviationPercent) : 'N/A'}
              color={point.isOutlier ? 'text-dashboard-error' : 'text-dashboard-accent'}
            />
          </div>

          {/* Deviation Bar */}
          {point.deviationPercent !== null && (
            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.5rem 2rem', marginBottom: '6.25rem' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dashboard-muted">Forecast Deviation</span>
                <span className={`text-sm font-semibold ${point.isOutlier ? 'text-dashboard-error' : 'text-dashboard-accent'}`}>
                  {formatPercent(point.deviationPercent)}
                </span>
              </div>
              <div className="relative h-3 bg-dashboard-border rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-[40%] right-[40%] bg-dashboard-accent/20 rounded-full" />
                <div
                  className="absolute top-0 h-full w-1.5 rounded-full"
                  style={{
                    left: `${Math.max(0, Math.min(100, 50 + point.deviationPercent * 2))}%`,
                    backgroundColor: point.isOutlier ? '#EF4444' : '#10B981',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-dashboard-muted">-25%</span>
                <span className="text-xs text-dashboard-muted">0%</span>
                <span className="text-xs text-dashboard-muted">+25%</span>
              </div>
            </div>
          )}

          {/* AI Explanation */}
          {point.isOutlier && (
            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.5rem 2rem' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Brain className="w-5 h-5 text-dashboard-predict" />
                <span className="text-base font-medium text-white">AI Analysis</span>
              </div>
              {explanationLoading && !explanation ? (
                <div className="space-y-3">
                  <div className="h-3.5 bg-dashboard-border rounded animate-pulse w-full" />
                  <div className="h-3.5 bg-dashboard-border rounded animate-pulse w-5/6" />
                  <div className="h-3.5 bg-dashboard-border rounded animate-pulse w-3/5" />
                </div>
              ) : (
                <p className="text-sm text-gray-300 leading-7">
                  {explanation}
                  {explanationLoading && <span className="inline-block w-1.5 h-4 bg-dashboard-predict ml-0.5 animate-pulse" />}
                </p>
              )}
            </div>
          )}

          {!point.isOutlier && (
            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.5rem 2rem' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Brain className="w-5 h-5 text-dashboard-accent" />
                <span className="text-base font-medium text-white">Forecast Assessment</span>
              </div>
              <p className="text-sm text-gray-300 leading-7">
                The actual demand on this date was within the ±10% confidence band of the forecast.
                No significant deviation was detected — the forecast model performed well for this period.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.25rem 1.5rem' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider text-dashboard-muted">{label}</span>
      </div>
      <p className={`text-base font-semibold ${color}`}>{value}</p>
    </div>
  );
}
