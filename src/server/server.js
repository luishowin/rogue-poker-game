import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "../client")));

import { NikoJadiEngine } from "../engine/index.js";

// --- Game rooms
const games = new Map(); // roomCode -> { engine, players }

// --- Helper
function createRoom(roomCode, players) {
  const engine = new NikoJadiEngine(players);
  games.set(roomCode, { engine, players });
  return games.get(roomCode);
}

// --- Socket events
io.on("connection", (socket) => {
  console.log(`🧩 ${socket.id} connected`);

  socket.on("createRoom", ({ roomCode, playerId }) => {
    const game = createRoom(roomCode, [playerId]);
    socket.join(roomCode);
    io.to(roomCode).emit("state", game.engine.state);
    console.log(`🎮 Room created: ${roomCode} by ${playerId}`);
  });

  socket.on("joinRoom", ({ roomCode, playerId }) => {
    const game = games.get(roomCode);
    if (!game) {
      socket.emit("error", "Room not found");
      return;
    }
    if (!game.players.includes(playerId)) {
      game.players.push(playerId);
      game.engine.state.hands[playerId] = game.engine.state.deck.splice(0, 5);
      game.engine.state.nikoDeclared[playerId] = false;
    }
    socket.join(roomCode);
    io.to(roomCode).emit("state", game.engine.state);
    console.log(`👥 ${playerId} joined room ${roomCode}`);
  });

  socket.on("move", ({ roomCode, playerId, card }) => {
    const game = games.get(roomCode);
    if (!game) return;
    const result = game.engine.processMove(playerId, { type: "play", card });
    io.to(roomCode).emit("state", game.engine.state);
  });

  socket.on("declareNiko", ({ roomCode, playerId }) => {
    const game = games.get(roomCode);
    if (!game) return;
    game.engine.processMove(playerId, { type: "declare" });
    io.to(roomCode).emit("state", game.engine.state);
  });

  socket.on("resetRoom", ({ roomCode }) => {
    const game = games.get(roomCode);
    if (!game) return;
    game.engine = new NikoJadiEngine(game.players);
    io.to(roomCode).emit("state", game.engine.state);
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${socket.id} disconnected`);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 NikoJadi WebSocket server running on http://localhost:${PORT}`);
});
// Note: Changed NikoJadi to NikoKadi in index.html