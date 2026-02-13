import { Router } from 'express';
import { getHistoricalDemand, getForecastedDemand, getWeatherData } from '../services/csvParser.js';

export const demandRouter = Router();

demandRouter.get('/demand', (req, res) => {
  const state = (req.query.state as string) || 'TX';
  const start = (req.query.start as string) || '2026-01-17';
  const end = (req.query.end as string) || '2026-02-20';

  const actual = getHistoricalDemand(state, start, end);
  const forecast = getForecastedDemand(state, start, end);
  const weather = getWeatherData(state, start, end);

  res.json({
    actual,
    forecast,
    weather,
    metadata: {
      state,
      dateRange: { start, end },
    },
  });
});
