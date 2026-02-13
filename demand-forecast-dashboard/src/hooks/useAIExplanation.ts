import { useState, useCallback } from 'react';
import type { SelectedPoint } from '@/types';
import { fetchExplanation } from '@/lib/api';

export function useAIExplanation() {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const explain = useCallback(async (point: SelectedPoint, state: string) => {
    // For comparison points, we need predicted; for primary points we need actual + predicted
    if (!point.isComparisonPoint && (point.actual === null || point.predicted === null)) return;
    if (point.isComparisonPoint && point.predicted === null) return;

    setExplanation('');
    setLoading(true);

    try {
      await fetchExplanation(
        {
          date: point.date,
          actual: point.actual ?? 0,
          predicted: point.predicted!,
          state,
          temperature: point.temperature,
          isComparisonPoint: point.isComparisonPoint,
          comparisonPredicted: point.comparisonPredicted,
          daysDifference: point.daysDifference,
        },
        (chunk) => {
          setExplanation((prev) => prev + chunk);
        }
      );
    } catch (err) {
      setExplanation('Unable to generate explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExplanation('');
    setLoading(false);
  }, []);

  return { explanation, loading, explain, reset };
}
