import { useMemo } from 'react';
import type { DemandApiResponse } from '@/types';
import { mergeChartData, computeErrorMetrics, computeYDomain } from '@/lib/chartUtils';

export function useChartData(
  data: DemandApiResponse | null,
  selectedSources: string[],
  primaryDate: string,
  comparisonDate: string | null
) {
  // Compute Y domain from primary data only (stable when comparison slider moves)
  const yDomain = useMemo(() => {
    if (!data) return [0, 100000] as [number, number];
    const primaryOnly = mergeChartData(data.actual, data.forecast, data.weather, selectedSources, primaryDate, null);
    return computeYDomain(primaryOnly);
  }, [data, selectedSources, primaryDate]);

  const { chartData, metrics } = useMemo(() => {
    if (!data) return { chartData: [], metrics: { rmse: 0, mae: 0, maxError: 0, overallErrorRate: 0 } };
    const chartData = mergeChartData(data.actual, data.forecast, data.weather, selectedSources, primaryDate, comparisonDate);
    const metrics = computeErrorMetrics(chartData);
    return { chartData, metrics };
  }, [data, selectedSources, primaryDate, comparisonDate]);

  return { chartData, metrics, yDomain };
}
