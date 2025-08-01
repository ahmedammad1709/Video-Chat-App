const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Enable CORS for all routes
app.use(cors());

// Store connected clients
const connectedClients = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Add client to connected clients map
  connectedClients.set(socket.id, {
    id: socket.id,
    connectedAt: new Date()
  });
  
  // Send list of connected clients to the new user
  socket.emit('connected-clients', Array.from(connectedClients.values()));
  
  // Notify all other clients about the new user
  socket.broadcast.emit('user-joined', {
    id: socket.id,
    connectedAt: new Date()
  });
  
  // Log connection stats
  console.log(`Total connected clients: ${connectedClients.size}`);
  
  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    console.log(`Offer from ${socket.id} to ${data.target}`);
    
    // Validate data
    if (!data.target || !data.offer) {
      console.error('Invalid offer data received');
      return;
    }
    
    // Check if target user exists
    if (connectedClients.has(data.target)) {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        from: socket.id
      });
    } else {
      console.log(`Target user ${data.target} not found`);
      socket.emit('call-rejected', {
        from: data.target
      });
    }
  });
  
  socket.on('answer', (data) => {
    console.log(`Answer from ${socket.id} to ${data.target}`);
    
    // Validate data
    if (!data.target || !data.answer) {
      console.error('Invalid answer data received');
      return;
    }
    
    // Check if target user exists
    if (connectedClients.has(data.target)) {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        from: socket.id
      });
    } else {
      console.log(`Target user ${data.target} not found for answer`);
    }
  });
  
  socket.on('ice-candidate', (data) => {
    console.log(`ICE candidate from ${socket.id} to ${data.target}`);
    
    // Validate data
    if (!data.target || !data.candidate) {
      console.error('Invalid ICE candidate data received');
      return;
    }
    
    // Check if target user exists
    if (connectedClients.has(data.target)) {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    } else {
      console.log(`Target user ${data.target} not found for ICE candidate`);
    }
  });
  
  // Handle call rejection
  socket.on('call-rejected', (data) => {
    console.log(`Call rejected by ${socket.id} to ${data.target}`);
    
    if (connectedClients.has(data.target)) {
      socket.to(data.target).emit('call-rejected', {
        from: socket.id
      });
    }
  });
  
  // Handle call ending
  socket.on('call-ended', (data) => {
    console.log(`Call ended by ${socket.id} to ${data.target}`);
    
    if (connectedClients.has(data.target)) {
      socket.to(data.target).emit('call-ended', {
        from: socket.id
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    
    // Remove client from connected clients
    connectedClients.delete(socket.id);
    
    // Notify other clients about the disconnection
    socket.broadcast.emit('user-left', socket.id);
    
    // Log connection stats
    console.log(`Total connected clients: ${connectedClients.size}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
}); 