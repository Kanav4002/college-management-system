// Builds the Express app: middleware -> routes -> error handlers.
// We export the app *without* listening so server.js can boot it after
// the DB connection is ready.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const corsOptions = require('./config/cors');
const env = require('./config/env');
const errorMiddleware = require('./middlewares/error.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');

const authRoutes      = require('./modules/auth/auth.routes');
const groupRoutes     = require('./modules/groups/group.routes');
const complaintRoutes = require('./modules/complaints/complaint.routes');
const leaveRoutes     = require('./modules/leave/leave.routes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Health check (kept envelope-shaped — it's not consumed by the React app).
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } })
);

// Feature routes
app.use('/api/auth',       authRoutes);
app.use('/api/groups',     groupRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaves',     leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);

// 404 + central error handler must come last.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
