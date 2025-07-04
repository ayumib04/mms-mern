// frontend/src/services/websocket.js
import io from 'socket.io-client';

let socket = null;
const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';

export const initializeWebSocket = (token, userId) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Add polling as fallback
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    // Join user-specific room
    socket.emit('join:user', userId);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  // Return cleanup function
  return () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
};

export const getSocket = () => socket;

export const subscribeToEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }
  return () => {};
};

export const emitEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};

export const joinEquipmentRoom = (equipmentId) => {
  if (socket) {
    socket.emit('join:equipment', equipmentId);
  }
};

export const leaveEquipmentRoom = (equipmentId) => {
  if (socket) {
    socket.emit('leave:equipment', equipmentId);
  }
};