import { useState, useCallback } from 'react';
import type { DemandApiResponse } from '@/types';
import { fetchDemandData } from '@/lib/api';

export function useDemandData() {
  const [data, setData] = useState<DemandApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (state: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDemandData(state, startDate, endDate);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadData };
}
