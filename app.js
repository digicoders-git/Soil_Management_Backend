import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import dotenv from "dotenv"
dotenv.config();
import connectDB from './config/db.js';

const app = express();

// Ensure DB connection for all API requests (helpful for serverless)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database Connection Error' });
    }
  } else {
    next();
  }
});


// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175","https://soil-management-panel-xllp.vercel.app/"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});

app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import machineTypeRoutes from './routes/machineTypeRoutes.js';
import machineUnitRoutes from './routes/machineUnitRoutes.js';
import installmentRoutes from './routes/installmentRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js'; // Might still exist for general issues or replaced? User didn't delete report. We'll leave it but add repairs
import dailyUpdateRoutes from './routes/dailyUpdateRoutes.js';
import siteSettlementRoutes from './routes/siteSettlementRoutes.js';
import machineMovementRoutes from './routes/machineMovementRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import fundRoutes from './routes/fundRoutes.js';
import machineRoutes from './routes/machineRoutes.js';
import siteMachineRoutes from './routes/siteMachineRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';
import operatorAssignmentRoutes from './routes/operatorAssignmentRoutes.js';
import machineCategoryRoutes from './routes/machineCategoryRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/machine-types', machineTypeRoutes);
app.use('/api/machine-units', machineUnitRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes); // Keep for backwards compatibility if needed
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/site-settlements', siteSettlementRoutes);
app.use('/api/movements', machineMovementRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/admin-funds', fundRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/site-machines', siteMachineRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/operator-assignments', operatorAssignmentRoutes);
app.use('/api/machine-categories', machineCategoryRoutes);



// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
