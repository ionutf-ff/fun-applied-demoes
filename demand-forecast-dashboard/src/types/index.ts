export interface HistoricalDemand {
  date: string;
  region: string;
  value: number;
  unitOfMeasure: string;
  source: string;
  energySource: string;
}

export interface ForecastedDemand {
  dateOfPrediction: string;
  predictedDate: string;
  region: string;
  value: number;
  unitOfMeasure: string;
  energySource: string;
}

export interface WeatherData {
  date: string;
  region: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
}

export interface DemandApiResponse {
  actual: HistoricalDemand[];
  forecast: ForecastedDemand[];
  weather: WeatherData[];
  metadata: {
    state: string;
    dateRange: { start: string; end: string };
  };
}

export interface ChartDataPoint {
  date: string;
  actual: number | null;
  predicted: number | null;
  predictedPast: number | null;
  predictedFuture: number | null;
  confidenceHigh: number | null;
  confidenceLow: number | null;
  isOutlier: boolean;
  isFuture: boolean;
  temperature: number | null;
  temperaturePast: number | null;
  temperatureFuture: number | null;
  humidity: number | null;
  humidityPast: number | null;
  humidityFuture: number | null;
  windSpeed: number | null;
  windSpeedPast: number | null;
  windSpeedFuture: number | null;
}

export interface SelectedPoint {
  date: string;
  actual: number | null;
  predicted: number | null;
  temperature: number | null;
  isOutlier: boolean;
  deviationPercent: number | null;
}

export interface FilterState {
  state: string;
  source: string;
  startDate: string;
  endDate: string;
  energySources: string[];
}
