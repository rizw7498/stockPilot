const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 StockPilot Backend Server running!`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Port: ${env.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`===============================================`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`[Process] Received ${signal}, closing HTTP server gracefully...`);
    server.close(() => {
      console.log('[Process] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
