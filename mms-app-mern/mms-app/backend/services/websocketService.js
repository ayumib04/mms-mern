// backend/services/websocketService.js
let io;

const initializeWebSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`New WebSocket connection: ${socket.id}`);

    // Join user-specific room
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    // Join equipment room for real-time updates
    socket.on('join:equipment', (equipmentId) => {
      socket.join(`equipment:${equipmentId}`);
    });

    // Leave equipment room
    socket.on('leave:equipment', (equipmentId) => {
      socket.leave(`equipment:${equipmentId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`WebSocket disconnected: ${socket.id}`);
    });
  });

  // Attach io to all requests
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

const getIO = () => io;

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to equipment watchers
const emitToEquipment = (equipmentId, event, data) => {
  if (io) {
    io.to(`equipment:${equipmentId}`).emit(event, data);
  }
};

module.exports = {
  initializeWebSocket,
  getIO,
  emitToUser,
  emitToEquipment
};
