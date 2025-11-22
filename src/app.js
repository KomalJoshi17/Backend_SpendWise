const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const passport = require('./config/passport');

// ROUTES
const authRoutes = require('./routes/authRoutes');
const authGoogleRoutes = require('./routes/authGoogleRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const insightRoutes = require('./routes/insightRoutes');
const profileRoutes = require('./routes/profileRoutes');
const aiRoutes = require('./routes/aiRoutes');
const healthRoutes = require('./routes/healthRoutes');

// ERROR HANDLER (YOU HAVE THIS FILE — IMPORT IT)
const errorHandler = require('./middleware/errorHandler');

// INIT APP FIRST (you previously used app before this line)
const app = express();

// CONNECT TO DATABASE
connectDB();

// MIDDLEWARE
// CORS configuration - use environment variable or allow common origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : process.env.NODE_ENV === 'production'
  ? [] // In production, FRONTEND_URL must be set
  : ['http://localhost:5173', 'http://localhost:3000']; // Dev fallback

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0) {
      console.error('❌ FRONTEND_URL not set in production - CORS will reject all requests');
      return callback(new Error('CORS: FRONTEND_URL environment variable is required'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// HEALTH CHECK ROUTE
app.use("/api/health", healthRoutes);

// ROOT ROUTE
app.get('/', (req, res) => {
  res.json({ message: 'SpendWise API is running' });
});

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/auth', authGoogleRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);

// ERROR HANDLER (MUST BE AFTER ROUTES)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
