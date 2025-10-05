// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files (index.html, client.js, etc)
app.use(express.static(__dirname));

// Room state
const rooms = {}; // { roomCode: { players: [socketIds], hands: {socketId: [cards]} } }

function generateCards() {
  const colors = ["red", "green", "blue", "yellow"];
  const values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Skip", "Reverse", "+2"];
  const deck = [];
  colors.forEach(c => values.forEach(v => deck.push({ color: c, value: v })));
  return deck.sort(() => Math.random() - 0.5);
}

io.on("connection", (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);

  socket.on("createRoom", (code) => {
    if (!rooms[code]) {
      rooms[code] = { players: [socket.id], hands: {} };
      socket.join(code);
      io.to(socket.id).emit("roomCreated", code);
      console.log(`✅ Room created: ${code}`);
    } else {
      io.to(socket.id).emit("error", "Room already exists");
    }
  });

  socket.on("joinRoom", (code) => {
    if (rooms[code]) {
      rooms[code].players.push(socket.id);
      socket.join(code);
      io.to(socket.id).emit("roomJoined", code);
      console.log(`👥 ${socket.id} joined ${code}`);
    } else {
      io.to(socket.id).emit("error", "Room not found");
    }
  });

  socket.on("startGame", (code) => {
    const room = rooms[code];
    if (!room) return;

    const deck = generateCards();
    room.players.forEach((pid) => {
      const hand = deck.splice(0, 7);
      room.hands[pid] = hand;
      io.to(pid).emit("startGame", hand);
    });

    io.to(code).emit("message", "Game started!");
    console.log(`🎮 Game started in room ${code}`);
  });

  socket.on("playCard", ({ room, card }) => {
    console.log(`🃏 ${socket.id} played ${card.color} ${card.value}`);
    io.to(room).emit("message", `Player ${socket.id.slice(0,4)} played ${card.color} ${card.value}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
    for (const code in rooms) {
      const r = rooms[code];
      r.players = r.players.filter((id) => id !== socket.id);
      if (r.players.length === 0) delete rooms[code];
    }
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
