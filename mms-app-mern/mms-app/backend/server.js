// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDB } = require('./config/database');
const { initializeWebSocket } = require('./services/websocketService');
const { startAutoWorkOrderJob } = require('./services/autoWorkOrderService');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Initialize WebSocket
initializeWebSocket(io);

// Start background jobs
startAutoWorkOrderJob();

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});