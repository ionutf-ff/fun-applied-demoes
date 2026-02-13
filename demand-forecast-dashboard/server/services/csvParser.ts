import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');

interface HistoricalRow {
  Date: string;
  Region: string;
  Value: string;
  UnitOfMeasure: string;
  Source: string;
  EnergySource: string;
}

interface ForecastRow {
  DateOfPrediction: string;
  PredictedDate: string;
  Region: string;
  Value: string;
  UnitOfMeasure: string;
  EnergySource: string;
}

interface WeatherRow {
  Date: string;
  Region: string;
  Temperature: string;
  WindSpeed: string;
  Humidity: string;
}

let historicalData: HistoricalRow[] | null = null;
let forecastData: ForecastRow[] | null = null;
let weatherData: WeatherRow[] | null = null;

function loadHistorical(): HistoricalRow[] {
  if (!historicalData) {
    const content = readFileSync(join(dataDir, 'historical_demand.csv'), 'utf-8');
    historicalData = parse(content, { columns: true, skip_empty_lines: true });
  }
  return historicalData!;
}

function loadForecast(): ForecastRow[] {
  if (!forecastData) {
    const content = readFileSync(join(dataDir, 'forecasted_demand.csv'), 'utf-8');
    forecastData = parse(content, { columns: true, skip_empty_lines: true });
  }
  return forecastData!;
}

function loadWeather(): WeatherRow[] {
  if (!weatherData) {
    const content = readFileSync(join(dataDir, 'weather.csv'), 'utf-8');
    weatherData = parse(content, { columns: true, skip_empty_lines: true });
  }
  return weatherData!;
}

export function getHistoricalDemand(state: string, startDate: string, endDate: string) {
  const data = loadHistorical();
  return data
    .filter(
      (row) =>
        row.Region === state &&
        row.Date >= startDate &&
        row.Date <= endDate
    )
    .map((row) => ({
      date: row.Date,
      region: row.Region,
      value: parseFloat(row.Value),
      unitOfMeasure: row.UnitOfMeasure,
      source: row.Source,
      energySource: row.EnergySource,
    }));
}

export function getForecastedDemand(state: string, startDate: string, endDate: string) {
  const data = loadForecast();
  return data
    .filter(
      (row) =>
        row.Region === state &&
        row.PredictedDate >= startDate &&
        row.PredictedDate <= endDate
    )
    .map((row) => ({
      dateOfPrediction: row.DateOfPrediction,
      predictedDate: row.PredictedDate,
      region: row.Region,
      value: parseFloat(row.Value),
      unitOfMeasure: row.UnitOfMeasure,
      energySource: row.EnergySource,
    }));
}

export function getWeatherData(state: string, startDate: string, endDate: string) {
  const data = loadWeather();
  return data
    .filter(
      (row) =>
        row.Region === state &&
        row.Date >= startDate &&
        row.Date <= endDate
    )
    .map((row) => ({
      date: row.Date,
      region: row.Region,
      temperature: parseFloat(row.Temperature),
      windSpeed: parseFloat(row.WindSpeed),
      humidity: parseFloat(row.Humidity),
    }));
}
