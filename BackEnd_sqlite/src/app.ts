import express from 'express';
import cors from 'cors';
import statusRoutes from './routes/status.routes.js'; // .js obligatoire
import userRoutes from './routes/users.routes.js'; // .js obligatoire
import parameterRoutes from './routes/parameter.routes.ts';

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes de l'API
app.use('/api', statusRoutes);
app.use('/api/users',userRoutes);
app.use('/api/Parameter',parameterRoutes);

export default app;