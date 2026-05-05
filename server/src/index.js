const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const socketSingleton = require('./socket');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const roomRoutes = require('./routes/rooms');
const matchRoutes = require('./routes/match');
const shortlistRoutes = require('./routes/shortlist');
const chatRoutes = require('./routes/chat');
const bookingsRoutes = require('./routes/bookings');
const usersRoutes = require('./routes/users');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Register io with the singleton so routes can access it without circular deps
socketSingleton.setIO(io);

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/connections', require('./routes/connections'));

if (process.env.NODE_ENV !== 'production') {
  const devRoutes = require('./routes/dev');
  app.use('/api/dev', devRoutes);
}

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // Join user's personal notification room (for booking/connection updates)
  socket.on('joinUserRoom', ({ userId }) => {
    if (userId) socket.join(userId);
  });

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', (message) => {
    // message should have { roomId, from, to, text }
    io.to(message.roomId).emit('newMessage', message);
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'RoomRadar API is running' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });

module.exports = { io };
