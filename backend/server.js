const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim().replace(/\/$/, ''))
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to every request so controllers can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ──────────────────────────────────────────────
app.use('/api/customers', require('./routes/customers'));
app.use('/api/drivers',   require('./routes/drivers'));
app.use('/api/rides',     require('./routes/rides'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/feedback',  require('./routes/feedback'));
app.use('/api/reports',   require('./routes/reports'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Socket.io ───────────────────────────────────────────
require('./socket/socketHandler')(io);

// ── Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀  CabGo backend running on port ${PORT}`);
  console.log(`📡  Socket.io ready`);
});
