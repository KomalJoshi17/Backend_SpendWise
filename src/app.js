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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
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
