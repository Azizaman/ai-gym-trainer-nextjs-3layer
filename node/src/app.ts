import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import analyzeRouter from './routes/analyze';
import resultsRouter from './routes/results';
import './workers/analysisWorker'; // start the BullMQ worker

config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', analyzeRouter);
app.use('/api', resultsRouter);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'node-api' });
});

export default app;
