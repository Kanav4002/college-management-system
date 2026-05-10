// Application entry point.
// 1) connect to MongoDB, 2) start listening, 3) handle graceful shutdown.

const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');
const logger = require('./utils/logger');

async function bootstrap() {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.PORT} is already in use. Stop the running process or set a different PORT.`);
      } else {
        logger.error('Server failed to start:', error.message);
      }
      process.exit(1);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
