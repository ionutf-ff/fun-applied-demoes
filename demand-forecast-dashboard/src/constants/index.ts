export const US_STATES = [
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
] as const;

export const REGION_SOURCES: Record<string, string[]> = {
  TX: ['ERCOT'],
  CA: ['CAISO'],
  NY: ['NYISO'],
  FL: ['FRCC'],
  IL: ['PJM'],
};

export const CHART_COLORS = {
  actual: '#10B981',
  predicted: '#8B5CF6',
  confidenceBand: '#6B7280',
  outlier: '#EF4444',
  todayLine: '#FBBF24',
  comparison: '#FB923C',
  comparisonLine: '#FB923C',
  grid: '#1F2937',
  axis: '#6B7280',
} as const;

export const ENERGY_SOURCES = ['Gas', 'Nuclear', 'Solar', 'Wind'] as const;

export const DEFAULT_STATE = 'TX';
export const DEFAULT_SOURCE = 'ERCOT';
export const DEFAULT_START_DATE = '2026-01-17';
export const DEFAULT_END_DATE = '2026-02-20';
