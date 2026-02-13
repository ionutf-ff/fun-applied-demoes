import type { HistoricalDemand, ForecastedDemand, WeatherData, ChartDataPoint } from '@/types';

const TODAY = '2026-02-13';

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
  selectedSources: string[]
): ChartDataPoint[] {
  // Aggregate actual demand by date (sum selected energy sources)
  const actualByDate = aggregateByDate(
    actual.map((a) => ({ date: a.date, value: a.value, energySource: a.energySource })),
    selectedSources
  );

  // Get the latest forecast per (predictedDate, energySource) keeping latest dateOfPrediction
  const latestForecastMap = new Map<string, ForecastedDemand>();
  for (const f of forecast) {
    const key = `${f.predictedDate}|${f.energySource}`;
    const existing = latestForecastMap.get(key);
    if (!existing || f.dateOfPrediction > existing.dateOfPrediction) {
      latestForecastMap.set(key, f);
    }
  }

  // Aggregate forecasts by date (sum selected energy sources)
  const forecastByDate = new Map<string, number>();
  for (const f of latestForecastMap.values()) {
    if (selectedSources.length > 0 && !selectedSources.includes(f.energySource)) continue;
    const date = f.predictedDate;
    forecastByDate.set(date, (forecastByDate.get(date) || 0) + f.value);
  }

  // Weather by date (one entry per date, no energy source dimension)
  const weatherByDate = new Map<string, WeatherData>();
  for (const w of weather) {
    weatherByDate.set(w.date, w);
  }

  // Collect all dates
  const allDates = new Set<string>();
  actualByDate.forEach((_, date) => allDates.add(date));
  forecastByDate.forEach((_, date) => allDates.add(date));
  weatherByDate.forEach((_, date) => allDates.add(date));

  const sortedDates = Array.from(allDates).sort();
  const result: ChartDataPoint[] = [];

  for (const date of sortedDates) {
    const isFuture = date > TODAY;
    const actualValue = actualByDate.get(date) ?? null;
    const predictedValue = forecastByDate.get(date) ?? null;
    const weatherEntry = weatherByDate.get(date);
    const temp = weatherEntry ? weatherEntry.temperature : null;
    const hum = weatherEntry ? weatherEntry.humidity : null;
    const wind = weatherEntry ? weatherEntry.windSpeed : null;

    let isOutlier = false;
    if (actualValue !== null && predictedValue !== null) {
      const deviation = Math.abs(actualValue - predictedValue) / predictedValue;
      isOutlier = deviation > 0.1;
    }

    result.push({
      date,
      actual: actualValue,
      predicted: predictedValue,
      predictedPast: !isFuture ? predictedValue : null,
      predictedFuture: isFuture ? predictedValue : null,
      confidenceHigh: predictedValue !== null ? predictedValue * 1.1 : null,
      confidenceLow: predictedValue !== null ? predictedValue * 0.9 : null,
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

  // Ensure connection at today boundary
  const todayPoint = result.find((p) => p.date === TODAY);
  if (todayPoint) {
    if (todayPoint.predicted !== null) todayPoint.predictedFuture = todayPoint.predicted;
    if (todayPoint.temperature !== null) todayPoint.temperatureFuture = todayPoint.temperature;
    if (todayPoint.humidity !== null) todayPoint.humidityFuture = todayPoint.humidity;
    if (todayPoint.windSpeed !== null) todayPoint.windSpeedFuture = todayPoint.windSpeed;
  }

  return result;
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
