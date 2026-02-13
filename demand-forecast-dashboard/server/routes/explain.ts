import { Router } from 'express';
import { generateMockExplanation } from '../services/aiExplainer.js';

export const explainRouter = Router();

explainRouter.post('/explain', async (req, res) => {
  const { date, actual, predicted, state, temperature } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const chunks = generateMockExplanation({
    date,
    actual,
    predicted,
    state,
    temperature,
  });

  for (const chunk of chunks) {
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120));
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});
