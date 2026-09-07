const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://ec2-65-2-187-91.ap-south-1.compute.amazonaws.com:3000', methods: ['GET','POST','PUT','PATCH','DELETE'] }
});

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://ec2-65-2-187-91.ap-south-1.compute.amazonaws.com:3000' }));
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
  console.log(`🚀  CabGo backend running at http://ec2-65-2-187-91.ap-south-1.compute.amazonaws.com:${PORT}`);
  console.log(`📡  Socket.io ready`);
});
