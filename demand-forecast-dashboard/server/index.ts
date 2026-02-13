import express from 'express';
import cors from 'cors';
import { demandRouter } from './routes/demand.js';
import { explainRouter } from './routes/explain.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', demandRouter);
app.use('/api', explainRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
