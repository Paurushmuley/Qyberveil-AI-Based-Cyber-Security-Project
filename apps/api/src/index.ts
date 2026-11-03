import { createApp } from './app.js';
import { config } from './config/index.js';
import { disconnectPrisma } from './services/prisma.service.js';
import { disconnectRedis } from './services/redis.service.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`🛡️ Qyberveil Security Assessment Platform running on port ${config.PORT} [${config.NODE_ENV}]`);
  console.log(`   Healthcheck: http://localhost:${config.PORT}/health`);
  console.log(`   API Endpoint: http://localhost:${config.PORT}/api`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await disconnectPrisma();
    console.log('Database connections closed.');
    await disconnectRedis();
    console.log('Redis connections closed.');
    process.exit(0);
  });

  // Force exit after 10s if connections linger
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Global process safety handlers to prevent transient Neon DB disconnects from crashing server
process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled Rejection (handled to prevent server crash):', reason);
});

process.on('uncaughtException', (error) => {
  console.warn('[Process] Uncaught Exception (handled to prevent server crash):', error);
});

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
