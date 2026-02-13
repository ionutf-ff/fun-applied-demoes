import { useMemo } from 'react';
import type { DemandApiResponse } from '@/types';
import { mergeChartData, computeErrorMetrics } from '@/lib/chartUtils';

export function useChartData(data: DemandApiResponse | null, selectedSources: string[]) {
  return useMemo(() => {
    if (!data) return { chartData: [], metrics: { rmse: 0, mae: 0, maxError: 0 } };

    const chartData = mergeChartData(data.actual, data.forecast, data.weather, selectedSources);
    const metrics = computeErrorMetrics(chartData);

    return { chartData, metrics };
  }, [data, selectedSources]);
}
