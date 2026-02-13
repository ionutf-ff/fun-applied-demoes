import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { DemandChart } from '@/components/DemandChart';
import { TimelineSlider } from '@/components/TimelineSlider';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { useDemandData } from '@/hooks/useDemandData';
import { useChartData } from '@/hooks/useChartData';
import { useAIExplanation } from '@/hooks/useAIExplanation';
import { CHART_COLORS, DEFAULT_STATE, DEFAULT_SOURCE, DEFAULT_START_DATE, DEFAULT_END_DATE } from '@/constants';
import type { FilterState, SelectedPoint } from '@/types';

const TODAY = '2026-02-13';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    state: DEFAULT_STATE,
    source: DEFAULT_SOURCE,
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
    energySources: [],
  });

  const [primaryDate, setPrimaryDate] = useState(TODAY);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparisonDate, setComparisonDate] = useState(DEFAULT_START_DATE);
  const [playing, setPlaying] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, loading, loadData } = useDemandData();
  const { chartData, metrics, yDomain } = useChartData(
    data,
    filters.energySources,
    primaryDate,
    compareEnabled ? comparisonDate : null
  );
  const { explanation, loading: explanationLoading, explain, reset: resetExplanation } = useAIExplanation();

  useEffect(() => {
    loadData(filters.state, filters.startDate, filters.endDate);
  }, []);

  // Clamp primaryDate when date range changes
  useEffect(() => {
    if (primaryDate < filters.startDate) {
      setPrimaryDate(filters.startDate);
    } else if (primaryDate > filters.endDate) {
      setPrimaryDate(filters.endDate);
    }
  }, [filters.startDate, filters.endDate]);

  // Clamp comparisonDate when primaryDate changes (slider goes up to primaryDate)
  useEffect(() => {
    if (comparisonDate > primaryDate) {
      setComparisonDate(primaryDate);
    }
    if (comparisonDate < filters.startDate) {
      setComparisonDate(filters.startDate);
    }
  }, [primaryDate, filters.startDate]);

  // Playback timer for comparison slider
  useEffect(() => {
    if (playing) {
      playIntervalRef.current = setInterval(() => {
        setComparisonDate((prev) => {
          const current = new Date(prev + 'T00:00:00');
          current.setDate(current.getDate() + 1);
          const next = current.toISOString().split('T')[0];
          if (next > primaryDate) {
            setPlaying(false);
            return prev;
          }
          return next;
        });
      }, 800);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [playing, primaryDate]);

  const handleFilterUpdate = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setSelectedPoint(null);
      resetExplanation();
      if (
        newFilters.state !== filters.state ||
        newFilters.startDate !== filters.startDate ||
        newFilters.endDate !== filters.endDate
      ) {
        loadData(newFilters.state, newFilters.startDate, newFilters.endDate);
      }
    },
    [filters, loadData, resetExplanation]
  );

  const handlePrimaryDateChange = useCallback(
    (date: string) => {
      setPrimaryDate(date);
      setSelectedPoint(null);
      resetExplanation();
    },
    [resetExplanation]
  );

  const handleComparisonDateChange = useCallback(
    (date: string) => {
      setComparisonDate(date);
    },
    []
  );

  const handlePlayToggle = useCallback(() => {
    setPlaying((prev) => {
      if (!prev && comparisonDate >= primaryDate) {
        setComparisonDate(filters.startDate);
      }
      return !prev;
    });
  }, [comparisonDate, primaryDate, filters.startDate]);

  const handleCompareToggle = useCallback(() => {
    setCompareEnabled((prev) => {
      if (!prev) {
        // When enabling, reset comparison to start date
        setComparisonDate(filters.startDate);
      } else {
        setPlaying(false);
      }
      return !prev;
    });
  }, [filters.startDate]);

  const handlePointClick = useCallback(
    (point: SelectedPoint) => {
      setSelectedPoint(point);
      resetExplanation();
      if (point.isComparisonPoint) {
        // Always explain comparison points (outlier or not)
        explain(point, filters.state);
      } else if (point.isOutlier) {
        explain(point, filters.state);
      }
    },
    [filters.state, explain, resetExplanation]
  );

  const handlePanelClose = useCallback(() => {
    setSelectedPoint(null);
    resetExplanation();
  }, [resetExplanation]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header filters={filters} onUpdate={handleFilterUpdate} loading={loading} />

      <main style={{ margin: '2rem 2.5rem' }}>
        {loading ? (
          <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-6 h-[580px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-dashboard-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-dashboard-muted">Loading demand data...</span>
            </div>
          </div>
        ) : (
          <>
            <DemandChart
              data={chartData}
              metrics={metrics}
              yDomain={yDomain}
              primaryDate={primaryDate}
              comparisonDate={compareEnabled ? comparisonDate : null}
              startDate={filters.startDate}
              endDate={filters.endDate}
              onPrimaryDateChange={handlePrimaryDateChange}
              onPointClick={handlePointClick}
            />

            {/* Compare section */}
            <div
              className="bg-dashboard-card rounded-xl border border-dashboard-border"
              style={{
                padding: '1rem 1.5rem',
                marginTop: '1rem',
                borderColor: compareEnabled ? CHART_COLORS.comparisonLine + '40' : undefined,
              }}
            >
              <div className="flex items-center gap-6">
                {/* Compare checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={compareEnabled}
                    onChange={handleCompareToggle}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{
                      borderColor: compareEnabled ? CHART_COLORS.comparisonLine : '#6B7280',
                      backgroundColor: compareEnabled ? CHART_COLORS.comparisonLine : 'transparent',
                    }}
                  >
                    {compareEnabled && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-300">Compare with a previous forecast?</span>
                </label>

                {/* Slider (only when compare is enabled) */}
                {compareEnabled && (
                  <div className="flex-1">
                    <TimelineSlider
                      startDate={filters.startDate}
                      endDate={primaryDate}
                      selectedDate={comparisonDate}
                      onChange={handleComparisonDateChange}
                      playing={playing}
                      onPlayToggle={handlePlayToggle}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AnalysisPanel
        point={selectedPoint}
        explanation={explanation}
        explanationLoading={explanationLoading}
        onClose={handlePanelClose}
      />
    </div>
  );
}

export default App;
