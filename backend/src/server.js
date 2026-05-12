// Application entry point.
// 1) connect to MongoDB, 2) start listening, 3) handle graceful shutdown.

const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');
const { setupSocketServer } = require('./socket/socketServer');
const logger = require('./utils/logger');

async function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
      setupSocketServer(server);
      resolve(server);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}

async function bootstrap() {
  try {
    await connectDB();

    let currentPort = env.PORT;
    let server;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        server = await startServer(currentPort);
        break;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          logger.warn(`Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
          currentPort += 1;
        } else {
          throw error;
        }
      }
    }

    if (!server) {
      logger.error(`Failed to bind to any port starting at ${env.PORT}.`);
      process.exit(1);
      return;
    }

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
