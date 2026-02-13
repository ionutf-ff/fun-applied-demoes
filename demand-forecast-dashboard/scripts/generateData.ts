import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

interface RegionConfig {
  region: string;
  source: string;
  baseLoad: number;
  amplitude: number;
  baseTemp: number;
  tempAmplitude: number;
  coldSnapDay?: number;
  coldSnapDuration?: number;
  coldSnapTempDrop?: number;
  // Energy mix percentages (gas, nuclear, solar, wind)
  energyMix: [number, number, number, number];
}

const ENERGY_SOURCES = ['Gas', 'Nuclear', 'Solar', 'Wind'] as const;

const regions: RegionConfig[] = [
  {
    region: 'TX',
    source: 'ERCOT',
    baseLoad: 42000,
    amplitude: 5000,
    baseTemp: 52,
    tempAmplitude: 12,
    coldSnapDay: 8,       // Jan 25
    coldSnapDuration: 3,
    coldSnapTempDrop: 30,
    energyMix: [0.40, 0.10, 0.22, 0.28],
  },
  {
    region: 'CA',
    source: 'CAISO',
    baseLoad: 28000,
    amplitude: 3000,
    baseTemp: 58,
    tempAmplitude: 8,
    energyMix: [0.35, 0.08, 0.32, 0.25],
  },
  {
    region: 'NY',
    source: 'NYISO',
    baseLoad: 18000,
    amplitude: 2500,
    baseTemp: 32,
    tempAmplitude: 10,
    coldSnapDay: 15,
    coldSnapDuration: 2,
    coldSnapTempDrop: 20,
    energyMix: [0.38, 0.30, 0.08, 0.24],
  },
  {
    region: 'FL',
    source: 'FRCC',
    baseLoad: 22000,
    amplitude: 2000,
    baseTemp: 65,
    tempAmplitude: 6,
    energyMix: [0.55, 0.12, 0.20, 0.13],
  },
  {
    region: 'IL',
    source: 'PJM',
    baseLoad: 15000,
    amplitude: 2000,
    baseTemp: 28,
    tempAmplitude: 10,
    coldSnapDay: 10,
    coldSnapDuration: 2,
    coldSnapTempDrop: 18,
    energyMix: [0.25, 0.50, 0.10, 0.15],
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const startDate = new Date('2026-01-17');
const todayDate = new Date('2026-02-13');
const endDate = new Date('2026-02-20');

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// CSV rows
const historicalRows: string[] = ['Date,Region,Value,UnitOfMeasure,Source,EnergySource'];
const forecastRows: string[] = ['DateOfPrediction,PredictedDate,Region,Value,UnitOfMeasure,EnergySource'];
const weatherRows: string[] = ['Date,Region,Temperature,WindSpeed,Humidity'];

for (const config of regions) {
  const rand = seededRandom(config.region.charCodeAt(0) * 1000 + config.region.charCodeAt(1));

  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const historicalDays = Math.round((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Generate true temperature and total demand for all days
  const temps: number[] = [];
  const windSpeeds: number[] = [];
  const humidities: number[] = [];
  const trueValues: number[] = [];

  for (let d = 0; d <= totalDays; d++) {
    const dayOfWeek = addDays(startDate, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base temperature with some variation
    let temp = config.baseTemp + config.tempAmplitude * Math.sin((d / 28) * Math.PI * 2) + (rand() - 0.5) * 8;

    // Cold snap
    if (config.coldSnapDay !== undefined && d >= config.coldSnapDay && d < config.coldSnapDay + (config.coldSnapDuration || 2)) {
      temp -= config.coldSnapTempDrop || 20;
    }

    temp = Math.round(temp);
    temps.push(temp);

    // Wind speed: 5-25 mph with some variation
    const windSpeed = Math.round(10 + (rand() - 0.5) * 15 + Math.sin((d / 14) * Math.PI) * 5);
    windSpeeds.push(Math.max(2, Math.min(35, windSpeed)));

    // Humidity: 30-90%
    const humidity = Math.round(55 + (rand() - 0.5) * 40 + Math.cos((d / 21) * Math.PI) * 10);
    humidities.push(Math.max(20, Math.min(95, humidity)));

    // Demand: inversely correlated with temperature (cold = more heating)
    let demand = config.baseLoad;
    // Weekday/weekend pattern
    demand += isWeekend ? -config.amplitude * 0.4 : config.amplitude * 0.3;
    // Temperature effect: below 40°F increases demand, above 75°F increases demand (AC)
    if (temp < 40) {
      demand += (40 - temp) * 120;
    } else if (temp > 75) {
      demand += (temp - 75) * 100;
    }
    // Random noise
    demand += (rand() - 0.5) * config.amplitude * 0.6;

    trueValues.push(Math.round(demand));
  }

  // Weather data for all days (past + future)
  for (let d = 0; d <= totalDays; d++) {
    const date = formatDate(addDays(startDate, d));
    weatherRows.push(
      `${date},${config.region},${temps[d]},${windSpeeds[d]},${humidities[d]}`
    );
  }

  // Historical demand (up to and including today) — split by energy source
  for (let d = 0; d <= historicalDays; d++) {
    const date = formatDate(addDays(startDate, d));
    const totalDemand = trueValues[d];

    for (let s = 0; s < ENERGY_SOURCES.length; s++) {
      // Add slight noise to individual source percentages
      const basePercent = config.energyMix[s];
      const noise = (rand() - 0.5) * 0.04; // ±2% variation
      const sourceDemand = Math.round(totalDemand * (basePercent + noise));

      historicalRows.push(
        `${date},${config.region},${sourceDemand},MWh,${config.source},${ENERGY_SOURCES[s]}`
      );
    }
  }

  // Forecasted demand: each day has a prediction made for it — split by energy source
  for (let d = 0; d <= totalDays; d++) {
    const predictedDate = addDays(startDate, d);
    // Prediction was made 1 day before (or 7 days before for future)
    const predictionLead = d > historicalDays ? Math.min(d - historicalDays, 14) : 1;
    const dateOfPrediction = formatDate(addDays(predictedDate, -predictionLead));

    // Forecast = base demand pattern WITHOUT cold snap effects + small random error
    const dayOfWeek = predictedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let forecastDemand = config.baseLoad;
    forecastDemand += isWeekend ? -config.amplitude * 0.4 : config.amplitude * 0.3;

    // Forecast uses predicted temperature (doesn't know about cold snap)
    const expectedTemp = config.baseTemp + config.tempAmplitude * Math.sin((d / 28) * Math.PI * 2);
    if (expectedTemp < 40) {
      forecastDemand += (40 - expectedTemp) * 120;
    } else if (expectedTemp > 75) {
      forecastDemand += (expectedTemp - 75) * 100;
    }

    // Small forecast error
    forecastDemand += (rand() - 0.5) * config.amplitude * 0.3;

    for (let s = 0; s < ENERGY_SOURCES.length; s++) {
      const basePercent = config.energyMix[s];
      const noise = (rand() - 0.5) * 0.03;
      const sourceForecast = Math.round(forecastDemand * (basePercent + noise));

      forecastRows.push(
        `${dateOfPrediction},${formatDate(predictedDate)},${config.region},${sourceForecast},MWh,${ENERGY_SOURCES[s]}`
      );
    }
  }
}

writeFileSync(join(dataDir, 'historical_demand.csv'), historicalRows.join('\n'));
writeFileSync(join(dataDir, 'forecasted_demand.csv'), forecastRows.join('\n'));
writeFileSync(join(dataDir, 'weather.csv'), weatherRows.join('\n'));

console.log(`Generated ${historicalRows.length - 1} historical demand records`);
console.log(`Generated ${forecastRows.length - 1} forecast records`);
console.log(`Generated ${weatherRows.length - 1} weather records`);
console.log(`Data saved to ${dataDir}`);
