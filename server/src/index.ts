import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './game/roomManager';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Last Card Server Running' });
});

const roomManager = new RoomManager(io);

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', ({ nickname, profilePic, maxPlayers, settings }) => {
    roomManager.createRoom(socket, nickname, profilePic, maxPlayers, settings);
  });

  socket.on('joinRoom', ({ nickname, profilePic, roomCode }) => {
    roomManager.joinRoom(socket, nickname, profilePic, roomCode);
  });

  socket.on('startGame', ({ roomCode }) => {
    console.log(`[SOCKET] Received startGame request from ${socket.id} for room ${roomCode}`);
    roomManager.startGame(socket, roomCode);
  });

  socket.on('updateSettings', ({ roomCode, settings }) => {
    roomManager.updateSettings(socket, roomCode, settings);
  });

  socket.on('playCard', ({ roomCode, cardId, chosenColor }) => {
    roomManager.playCard(socket, roomCode, cardId, chosenColor);
  });

  socket.on('drawCard', ({ roomCode }) => {
    roomManager.drawCard(socket, roomCode);
  });

  socket.on('callLastCard', ({ roomCode }) => {
    roomManager.callLastCard(socket, roomCode);
  });

  socket.on('catchLastCard', ({ roomCode }) => {
    roomManager.catchLastCard(socket, roomCode);
  });

  socket.on('keepDrawnCard', ({ roomCode }) => {
    roomManager.keepDrawnCard(socket, roomCode);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
