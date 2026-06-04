import express from 'express';
import cors from 'cors';
import statusRoutes from './routes/status.routes.js'; // .js obligatoire

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes de l'API
app.use('/api', statusRoutes);

export default app;