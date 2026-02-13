import { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Thermometer, Zap, Brain, GitCompare, Calendar } from 'lucide-react';
import { formatMWh, formatDateFull, formatPercent, formatTemperature } from '@/lib/formatters';
import { CHART_COLORS } from '@/constants';
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

  const isComparison = point.isComparisonPoint === true;
  const isHigher = point.deviationPercent !== null && point.deviationPercent > 0;
  const compIsHigher = (point.comparisonDeviationPercent ?? 0) > 0;

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

          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '6.25rem' }}>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-white">
                {isComparison ? 'Comparison Analysis' : 'Demand Analysis'}
              </h3>
              {isComparison && (
                <span
                  className="text-xs font-medium rounded-full"
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: CHART_COLORS.comparisonLine + '20',
                    color: CHART_COLORS.comparisonLine,
                    border: `1px solid ${CHART_COLORS.comparisonLine}40`,
                  }}
                >
                  Comparison
                </span>
              )}
            </div>
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

          {/* Days Difference Badge (comparison only) */}
          {isComparison && point.daysDifference !== null && point.daysDifference !== undefined && (
            <div
              className="flex items-center gap-3 bg-dashboard-surface rounded-xl border border-dashboard-border"
              style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}
            >
              <Calendar className="w-5 h-5" style={{ color: CHART_COLORS.comparisonLine }} />
              <div>
                <span className="text-sm text-gray-300">Forecasts are </span>
                <span className="text-sm font-semibold" style={{ color: CHART_COLORS.comparisonLine }}>
                  {point.daysDifference} day{point.daysDifference !== 1 ? 's' : ''}
                </span>
                <span className="text-sm text-gray-300"> apart</span>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className={`grid gap-6 ${isComparison ? 'grid-cols-2' : 'grid-cols-2'}`} style={{ marginBottom: '6.25rem' }}>
            {point.actual !== null && (
              <MetricCard
                icon={<Zap className="w-5 h-5 text-dashboard-accent" />}
                label="Actual Demand"
                value={formatMWh(point.actual)}
                color="text-dashboard-accent"
              />
            )}
            <MetricCard
              icon={<Zap className="w-5 h-5 text-dashboard-predict" />}
              label="Forecast Demand"
              value={point.predicted !== null ? formatMWh(point.predicted) : 'N/A'}
              color="text-dashboard-predict"
            />
            {isComparison && point.comparisonPredicted !== null && point.comparisonPredicted !== undefined && (
              <MetricCard
                icon={<GitCompare className="w-5 h-5" style={{ color: CHART_COLORS.comparisonLine }} />}
                label="Comparison Demand"
                value={formatMWh(point.comparisonPredicted)}
                color=""
                customColor={CHART_COLORS.comparisonLine}
              />
            )}
            <MetricCard
              icon={<Thermometer className="w-5 h-5 text-blue-400" />}
              label="Temperature"
              value={point.temperature !== null ? formatTemperature(point.temperature) : 'N/A'}
              color="text-blue-400"
            />
            {!isComparison && (
              <MetricCard
                icon={isHigher ? <TrendingUp className="w-5 h-5 text-dashboard-error" /> : <TrendingDown className="w-5 h-5 text-dashboard-warning" />}
                label="Deviation"
                value={point.deviationPercent !== null ? formatPercent(point.deviationPercent) : 'N/A'}
                color={point.isOutlier ? 'text-dashboard-error' : 'text-dashboard-accent'}
              />
            )}
            {isComparison && point.comparisonDeviationPercent !== null && point.comparisonDeviationPercent !== undefined && (
              <MetricCard
                icon={compIsHigher ? <TrendingUp className="w-5 h-5 text-dashboard-error" /> : <TrendingDown className="w-5 h-5 text-dashboard-warning" />}
                label="Forecast Divergence"
                value={formatPercent(point.comparisonDeviationPercent)}
                color={Math.abs(point.comparisonDeviationPercent) > 5 ? 'text-dashboard-error' : 'text-dashboard-accent'}
              />
            )}
          </div>

          {/* Deviation Bar — for comparison points show comparison deviation */}
          {isComparison && point.comparisonDeviationPercent !== null && point.comparisonDeviationPercent !== undefined && (
            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.5rem 2rem', marginBottom: '6.25rem' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dashboard-muted">Comparison vs Forecast Divergence</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: Math.abs(point.comparisonDeviationPercent) > 5 ? '#EF4444' : CHART_COLORS.comparisonLine }}
                >
                  {formatPercent(point.comparisonDeviationPercent)}
                </span>
              </div>
              <div className="relative h-3 bg-dashboard-border rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-[45%] right-[45%] rounded-full" style={{ backgroundColor: CHART_COLORS.comparisonLine + '20' }} />
                <div
                  className="absolute top-0 h-full w-1.5 rounded-full"
                  style={{
                    left: `${Math.max(0, Math.min(100, 50 + point.comparisonDeviationPercent * 2))}%`,
                    backgroundColor: Math.abs(point.comparisonDeviationPercent) > 5 ? '#EF4444' : CHART_COLORS.comparisonLine,
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

          {/* Deviation Bar — for non-comparison points */}
          {!isComparison && point.deviationPercent !== null && (
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

          {/* AI Explanation — for outliers (both primary and comparison) */}
          {(point.isOutlier || (isComparison && point.comparisonDeviationPercent !== null && point.comparisonDeviationPercent !== undefined && Math.abs(point.comparisonDeviationPercent) > 0)) && (
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

          {!point.isOutlier && !isComparison && (
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
  customColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  customColor?: string;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border" style={{ padding: '1.25rem 1.5rem' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider text-dashboard-muted">{label}</span>
      </div>
      <p className={`text-base font-semibold ${color}`} style={customColor ? { color: customColor } : undefined}>{value}</p>
    </div>
  );
}
