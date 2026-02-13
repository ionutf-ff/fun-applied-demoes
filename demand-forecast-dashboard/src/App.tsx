import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DemandChart } from '@/components/DemandChart';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { useDemandData } from '@/hooks/useDemandData';
import { useChartData } from '@/hooks/useChartData';
import { useAIExplanation } from '@/hooks/useAIExplanation';
import { DEFAULT_STATE, DEFAULT_SOURCE, DEFAULT_START_DATE, DEFAULT_END_DATE } from '@/constants';
import type { FilterState, SelectedPoint } from '@/types';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    state: DEFAULT_STATE,
    source: DEFAULT_SOURCE,
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
    energySources: [],
  });

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

  const { data, loading, loadData } = useDemandData();
  const { chartData, metrics } = useChartData(data, filters.energySources);
  const { explanation, loading: explanationLoading, explain, reset: resetExplanation } = useAIExplanation();

  useEffect(() => {
    loadData(filters.state, filters.startDate, filters.endDate);
  }, []);

  const handleFilterUpdate = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setSelectedPoint(null);
      resetExplanation();
      // Only reload data from server if region/dates changed (energy source filtering is client-side)
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

  const handlePointClick = useCallback(
    (point: SelectedPoint) => {
      setSelectedPoint(point);
      resetExplanation();
      if (point.isOutlier) {
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
          <DemandChart data={chartData} metrics={metrics} onPointClick={handlePointClick} />
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
