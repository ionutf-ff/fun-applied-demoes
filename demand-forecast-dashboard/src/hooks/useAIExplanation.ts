import { useState, useCallback } from 'react';
import type { SelectedPoint } from '@/types';
import { fetchExplanation } from '@/lib/api';

export function useAIExplanation() {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const explain = useCallback(async (point: SelectedPoint, state: string) => {
    if (point.actual === null || point.predicted === null) return;

    setExplanation('');
    setLoading(true);

    try {
      await fetchExplanation(
        {
          date: point.date,
          actual: point.actual,
          predicted: point.predicted,
          state,
          temperature: point.temperature,
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
