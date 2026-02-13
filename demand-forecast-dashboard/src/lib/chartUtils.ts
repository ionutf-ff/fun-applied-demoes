import type { HistoricalDemand, ForecastedDemand, WeatherData, ChartDataPoint } from '@/types';

const REAL_TODAY = '2026-02-13';

/**
 * Aggregates demand rows by date, summing values for selected energy sources.
 * If selectedSources is empty, sums all sources.
 */
function aggregateByDate(
  rows: { date: string; value: number; energySource: string }[],
  selectedSources: string[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (selectedSources.length > 0 && !selectedSources.includes(row.energySource)) continue;
    map.set(row.date, (map.get(row.date) || 0) + row.value);
  }
  return map;
}

export function mergeChartData(
  actual: HistoricalDemand[],
  forecast: ForecastedDemand[],
  weather: WeatherData[],
  selectedSources: string[],
  primaryDate: string,
  comparisonDate: string | null
): ChartDataPoint[] {
  // Historical demand: always up to real today
  const actualByDate = aggregateByDate(
    actual.filter((a) => a.date <= REAL_TODAY).map((a) => ({ date: a.date, value: a.value, energySource: a.energySource })),
    selectedSources
  );

  // Primary forecast: dateOfPrediction === primaryDate
  const primaryForecast = forecast.filter((f) => f.dateOfPrediction === primaryDate);
  const primaryByDate = aggregateByDate(
    primaryForecast.map((f) => ({ date: f.predictedDate, value: f.value, energySource: f.energySource })),
    selectedSources
  );

  // Comparison forecast (if active)
  let comparisonByDate: Map<string, number> | null = null;
  if (comparisonDate) {
    const compForecast = forecast.filter((f) => f.dateOfPrediction === comparisonDate);
    comparisonByDate = aggregateByDate(
      compForecast.map((f) => ({ date: f.predictedDate, value: f.value, energySource: f.energySource })),
      selectedSources
    );
  }

  // Weather by date
  const weatherByDate = new Map<string, WeatherData>();
  for (const w of weather) {
    weatherByDate.set(w.date, w);
  }

  // Collect all dates
  const allDates = new Set<string>();
  actualByDate.forEach((_, date) => allDates.add(date));
  primaryByDate.forEach((_, date) => allDates.add(date));
  if (comparisonByDate) comparisonByDate.forEach((_, date) => allDates.add(date));
  weatherByDate.forEach((_, date) => allDates.add(date));

  const sortedDates = Array.from(allDates).sort();
  const result: ChartDataPoint[] = [];

  for (const date of sortedDates) {
    const isFuture = date > primaryDate;
    const actualValue = actualByDate.get(date) ?? null;
    const primaryValue = primaryByDate.get(date) ?? null;
    const compValue = comparisonByDate?.get(date) ?? null;
    const weatherEntry = weatherByDate.get(date);
    const temp = weatherEntry ? weatherEntry.temperature : null;
    const hum = weatherEntry ? weatherEntry.humidity : null;
    const wind = weatherEntry ? weatherEntry.windSpeed : null;

    // Outlier detection:
    // - Actual vs primary: 10% threshold (all dates)
    // - Comparison vs primary (past/between dates): 10% threshold (where actual exists)
    // - Comparison vs primary (future dates, after primaryDate): 5% threshold
    let isOutlier = false;
    let comparisonOutlier = false;

    if (primaryValue !== null) {
      if (actualValue !== null) {
        const actualDev = Math.abs(actualValue - primaryValue) / primaryValue;
        if (actualDev > 0.1) isOutlier = true;
      }
      if (compValue !== null) {
        const threshold = isFuture ? 0.05 : 0.1;
        const compDev = Math.abs(compValue - primaryValue) / primaryValue;
        if (compDev > threshold) {
          comparisonOutlier = true;
        }
      }
    }

    result.push({
      date,
      actual: actualValue,
      predicted: primaryValue,
      predictedPast: !isFuture ? primaryValue : null,
      predictedFuture: isFuture ? primaryValue : null,
      confidenceHigh: primaryValue !== null ? primaryValue * 1.1 : null,
      confidenceLow: primaryValue !== null ? primaryValue * 0.9 : null,
      comparisonPredicted: compValue,
      comparisonPredictedPast: !isFuture ? compValue : null,
      comparisonPredictedFuture: isFuture ? compValue : null,
      comparisonOutlier,
      isOutlier,
      isFuture,
      temperature: temp,
      temperaturePast: !isFuture ? temp : null,
      temperatureFuture: isFuture ? temp : null,
      humidity: hum,
      humidityPast: !isFuture ? hum : null,
      humidityFuture: isFuture ? hum : null,
      windSpeed: wind,
      windSpeedPast: !isFuture ? wind : null,
      windSpeedFuture: isFuture ? wind : null,
    });
  }

  // Ensure connection at the primaryDate boundary
  const boundaryPoint = result.find((p) => p.date === primaryDate);
  if (boundaryPoint) {
    if (boundaryPoint.predicted !== null) boundaryPoint.predictedFuture = boundaryPoint.predicted;
    if (boundaryPoint.comparisonPredicted !== null) boundaryPoint.comparisonPredictedFuture = boundaryPoint.comparisonPredicted;
    if (boundaryPoint.temperature !== null) boundaryPoint.temperatureFuture = boundaryPoint.temperature;
    if (boundaryPoint.humidity !== null) boundaryPoint.humidityFuture = boundaryPoint.humidity;
    if (boundaryPoint.windSpeed !== null) boundaryPoint.windSpeedFuture = boundaryPoint.windSpeed;
  }

  return result;
}

/**
 * Compute a fixed Y-axis domain from actual + primary forecast values.
 * Excludes comparison values so the domain stays stable when the comparison slider moves.
 */
export function computeYDomain(data: ChartDataPoint[]): [number, number] {
  const values: number[] = [];
  for (const d of data) {
    if (d.actual !== null) values.push(d.actual);
    if (d.predicted !== null) values.push(d.predicted);
  }
  if (values.length === 0) return [0, 100000];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.08;
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

export function computeErrorMetrics(data: ChartDataPoint[]): {
  rmse: number;
  mae: number;
  maxError: number;
  overallErrorRate: number;
} {
  const pairs = data.filter(
    (d) => d.actual !== null && d.predicted !== null
  );

  if (pairs.length === 0) return { rmse: 0, mae: 0, maxError: 0, overallErrorRate: 0 };

  let sumSquaredError = 0;
  let sumAbsError = 0;
  let maxError = 0;
  let sumPercentError = 0;

  for (const p of pairs) {
    const error = Math.abs(p.actual! - p.predicted!);
    sumSquaredError += error * error;
    sumAbsError += error;
    maxError = Math.max(maxError, error);
    sumPercentError += error / Math.abs(p.actual!);
  }

  return {
    rmse: Math.round(Math.sqrt(sumSquaredError / pairs.length)),
    mae: Math.round(sumAbsError / pairs.length),
    maxError: Math.round(maxError),
    overallErrorRate: parseFloat(((sumPercentError / pairs.length) * 100).toFixed(1)),
  };
}
