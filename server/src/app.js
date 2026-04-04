// server/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Route imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const planRoutes = require('./routes/plan.routes');
const templateRoutes = require('./routes/template.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const taxRoutes = require('./routes/tax.routes');
const discountRoutes = require('./routes/discount.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes = require('./routes/reports.routes');
const { startJobs } = require('./jobs');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
// Support comma-separated origins e.g. "https://sms.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan: 'dev' locally, 'combined' in production for structured logs
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// ─── Start Cron Jobs ───────────────────────────────────────────────────────────
startJobs();

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
