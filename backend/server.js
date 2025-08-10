const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ["https://chat-app-alpha-blue-30.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  } 
});

// Middleware
app.use(cors({
  origin: ["https://chat-app-alpha-blue-30.vercel.app", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// In-memory storage for waiting queues and rooms
const waitingQueues = { text: [], video: [] };
const rooms = new Map();
const socketToUser = new Map(); // socketId -> { username, mode, roomId }

// Helper function to remove user from waiting queue
function removeFromQueue(socketId, mode) {
  const queue = waitingQueues[mode];
  const index = queue.findIndex(user => user.socketId === socketId);
  if (index > -1) {
    queue.splice(index, 1);
    console.log(`[queue] Removed ${socketId} from ${mode} queue`);
    return true;
  }
  return false;
}

// Helper function to create a new room
function createRoom(socket1, socket2, mode) {
  const roomId = uuidv4().substring(0, 8); // Short room ID
  const room = {
    id: roomId,
    mode,
    sockets: [socket1.id, socket2.id],
    users: [
      { socketId: socket1.id, username: socketToUser.get(socket1.id)?.username || 'Anonymous' },
      { socketId: socket2.id, username: socketToUser.get(socket2.id)?.username || 'Anonymous' }
    ],
    createdAt: new Date()
  };
  
  rooms.set(roomId, room);
  
  // Join both sockets to the room
  socket1.join(roomId);
  socket2.join(roomId);
  
  console.log(`[room] Created room ${roomId} with users:`, room.users.map(u => u.username));
  return room;
}

// Helper function to cleanup room
function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    console.log(`[room] Cleaning up room ${roomId}`);
    rooms.delete(roomId);
    
    // Clean up user mappings
    room.sockets.forEach(socketId => {
      socketToUser.delete(socketId);
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[socket] Connected: ${socket.id}`);
  console.log(`[socket] Origin: ${socket.handshake.headers.origin}`);
  console.log(`[socket] User-Agent: ${socket.handshake.headers['user-agent']}`);
  
  // Send connection confirmation
  socket.emit('connected', { 
    message: 'Connected to chat server',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Start match - user wants to find a chat partner
  socket.on('start_match', ({ mode = 'text', username = 'Anonymous' }) => {
    try {
      console.log(`[match] User ${username} (${socket.id}) starting match for mode: ${mode}`);
      
      // Store user info
      socketToUser.set(socket.id, { username, mode });
      
      // Check if there's someone waiting in the queue
      const queue = waitingQueues[mode];
      if (queue.length > 0) {
        // Pair with waiting user
        const waitingUser = queue.shift(); // Remove first waiting user
        const waitingSocket = io.sockets.sockets.get(waitingUser.socketId);
        
        if (waitingSocket && waitingSocket.connected) {
          // Create room and pair users
          const room = createRoom(socket, waitingSocket, mode);
          
          // Notify both users they're matched
          socket.emit('matched', {
            event: 'matched',
            roomId: room.id,
            partner: {
              socketId: waitingSocket.id,
              username: waitingUser.username
            }
          });
          
          waitingSocket.emit('matched', {
            event: 'matched',
            roomId: room.id,
            partner: {
              socketId: socket.id,
              username: username
            }
          });
          
          console.log(`[match] Paired ${username} with ${waitingUser.username} in room ${room.id}`);
        } else {
          // Waiting user disconnected, put current user in queue
          console.log(`[match] Waiting user disconnected, putting ${username} in queue`);
          queue.push({ socketId: socket.id, username, timestamp: Date.now() });
          socket.emit('waiting', { message: 'Waiting for a partner...' });
        }
      } else {
        // No one waiting, add to queue
        queue.push({ socketId: socket.id, username, timestamp: Date.now() });
        socket.emit('waiting', { message: 'Waiting for a partner...' });
        console.log(`[match] ${username} added to ${mode} queue. Queue length: ${queue.length}`);
      }
      
    } catch (error) {
      console.error(`[error] start_match error:`, error);
      socket.emit('error', { message: 'Failed to start match' });
    }
  });

  // WebRTC Signaling - Offer
  socket.on('webrtc_offer', ({ roomId, offer }) => {
    try {
      console.log(`[webrtc] Offer from ${socket.id} in room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (!room || !room.sockets.includes(socket.id)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }
      
      // Forward offer to other users in the room
      socket.to(roomId).emit('webrtc_offer', { offer });
      
    } catch (error) {
      console.error(`[error] webrtc_offer error:`, error);
      socket.emit('error', { message: 'Failed to process WebRTC offer' });
    }
  });

  // WebRTC Signaling - Answer
  socket.on('webrtc_answer', ({ roomId, answer }) => {
    try {
      console.log(`[webrtc] Answer from ${socket.id} in room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (!room || !room.sockets.includes(socket.id)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }
      
      // Forward answer to other users in the room
      socket.to(roomId).emit('webrtc_answer', { answer });
      
    } catch (error) {
      console.error(`[error] webrtc_answer error:`, error);
      socket.emit('error', { message: 'Failed to process WebRTC answer' });
    }
  });

  // WebRTC Signaling - ICE Candidate
  socket.on('webrtc_ice_candidate', ({ roomId, candidate }) => {
    try {
      console.log(`[webrtc] ICE candidate from ${socket.id} in room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (!room || !room.sockets.includes(socket.id)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }
      
      // Forward ICE candidate to other users in the room
      socket.to(roomId).emit('webrtc_ice_candidate', { candidate });
      
    } catch (error) {
      console.error(`[error] webrtc_ice_candidate error:`, error);
      socket.emit('error', { message: 'Failed to process ICE candidate' });
    }
  });

  // Send message
  socket.on('send_message', ({ roomId, messageId, text, timestamp }) => {
    try {
      console.log(`[message] Message from ${socket.id} in room ${roomId}: "${text}"`);
      
      // Validate inputs
      if (!roomId || !messageId || !text || !timestamp) {
        socket.emit('error', { message: 'Invalid message payload' });
        return;
      }
      
      // Sanitize text (basic sanitization)
      const sanitizedText = text.trim().substring(0, 1000); // Limit length
      
      // Check if socket is in the room
      const room = rooms.get(roomId);
      if (!room || !room.sockets.includes(socket.id)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }
      
      const user = socketToUser.get(socket.id);
      const username = user ? user.username : 'Anonymous';
      
      // Emit message to other users in the room (exclude sender)
      socket.to(roomId).emit('receive_message', {
        messageId,
        text: sanitizedText,
        senderSocketId: socket.id,
        senderUsername: username,
        timestamp
      });
      
      // Send delivery acknowledgment back to sender
      socket.emit('message_delivered', {
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      });
      
      console.log(`[message] Message ${messageId} delivered to room ${roomId}`);
      
    } catch (error) {
      console.error(`[error] send_message error:`, error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Next - user wants to find a new partner
  socket.on('next', ({ roomId }) => {
    try {
      console.log(`[next] User ${socket.id} requesting next in room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (!room || !room.sockets.includes(socket.id)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }
      
      // Notify partner that user left
      socket.to(roomId).emit('partner_left', {
        message: 'Your partner has left the chat'
      });
      
      // Remove socket from current room
      socket.leave(roomId);
      
      // Clean up room if it's empty
      const updatedRoom = {
        ...room,
        sockets: room.sockets.filter(id => id !== socket.id),
        users: room.users.filter(user => user.socketId !== socket.id)
      };
      
      if (updatedRoom.sockets.length === 0) {
        cleanupRoom(roomId);
      } else {
        rooms.set(roomId, updatedRoom);
      }
      
      // Start match again for this user
      const user = socketToUser.get(socket.id);
      if (user) {
        console.log(`[next] Restarting match for ${user.username}`);
        socket.emit('waiting', { message: 'Looking for a new partner...' });
        
        // Check queue again
        const queue = waitingQueues[user.mode];
        if (queue.length > 0) {
          const waitingUser = queue.shift();
          const waitingSocket = io.sockets.sockets.get(waitingUser.socketId);
          
          if (waitingSocket && waitingSocket.connected) {
            const newRoom = createRoom(socket, waitingSocket, user.mode);
            
            socket.emit('matched', {
              event: 'matched',
              roomId: newRoom.id,
              partner: {
                socketId: waitingSocket.id,
                username: waitingUser.username
              }
            });
            
            waitingSocket.emit('matched', {
              event: 'matched',
              roomId: newRoom.id,
              partner: {
                socketId: socket.id,
                username: user.username
              }
            });
          }
        } else {
          queue.push({ socketId: socket.id, username: user.username, timestamp: Date.now() });
        }
      }
      
    } catch (error) {
      console.error(`[error] next error:`, error);
      socket.emit('error', { message: 'Failed to get next partner' });
    }
  });

  // Leave room
  socket.on('leave', ({ roomId }) => {
    try {
      console.log(`[leave] User ${socket.id} leaving room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (room && room.sockets.includes(socket.id)) {
        // Notify partner
        socket.to(roomId).emit('partner_left', {
          message: 'Your partner has left the chat'
        });
        
        // Remove from room
        socket.leave(roomId);
        
        // Clean up room
        const updatedRoom = {
          ...room,
          sockets: room.sockets.filter(id => id !== socket.id),
          users: room.users.filter(user => user.socketId !== socket.id)
        };
        
        if (updatedRoom.sockets.length === 0) {
          cleanupRoom(roomId);
        } else {
          rooms.set(roomId, updatedRoom);
        }
      }
      
    } catch (error) {
      console.error(`[error] leave error:`, error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`[socket] Disconnected: ${socket.id}`);
    
    const user = socketToUser.get(socket.id);
    if (user) {
      // Remove from waiting queue if they were waiting
      removeFromQueue(socket.id, user.mode);
      
      // Find and cleanup any rooms they were in
      for (const [roomId, room] of rooms.entries()) {
        if (room.sockets.includes(socket.id)) {
          console.log(`[disconnect] User ${user.username} disconnected from room ${roomId}`);
          
          // Notify partner
          socket.to(roomId).emit('partner_left', {
            message: 'Your partner has disconnected'
          });
          
          // Clean up room
          const updatedRoom = {
            ...room,
            sockets: room.sockets.filter(id => id !== socket.id),
            users: room.users.filter(user => user.socketId !== socket.id)
          };
          
          if (updatedRoom.sockets.length === 0) {
            cleanupRoom(roomId);
          } else {
            rooms.set(roomId, updatedRoom);
          }
          
          break; // User can only be in one room at a time
        }
      }
      
      // Clean up user mapping
      socketToUser.delete(socket.id);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    waitingQueues: {
      text: waitingQueues.text.length,
      video: waitingQueues.video.length
    },
    activeRooms: rooms.size,
    totalUsers: socketToUser.size
  };
  
  res.json(stats);
});

// Test endpoint for frontend connection
app.get('/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    frontend_url: 'https://chat-app-alpha-blue-30.vercel.app',
    backend_url: 'https://chat-app-tlxx.onrender.com',
    timestamp: new Date().toISOString(),
    cors_origin: req.headers.origin
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Socket.IO server ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
