import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRoom, joinRoom, startGame, playCard } from "./game/engine.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

let rooms = {};

export function startServer() {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("createRoom", (roomId) => {
      rooms[roomId] = createRoom(socket.id);
      socket.join(roomId);
      socket.emit("roomCreated", roomId);
    });

    socket.on("joinRoom", (roomId) => {
      const room = joinRoom(rooms, roomId, socket.id);
      if (room.error) return socket.emit("error", room.error);
      socket.join(roomId);
      io.to(roomId).emit("playerJoined", room.players);
    });

    socket.on("startGame", (roomId) => {
      const result = startGame(rooms, roomId);
      io.to(roomId).emit("gameStarted", result);
    });

    socket.on("playCard", (data) => {
      const result = playCard(rooms, data, socket.id);
      io.to(data.roomId).emit("gameUpdate", result);
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 10000;
  httpServer.listen(PORT, () =>
    console.log(`🚀 Rogue Poker server running on port ${PORT}`)
  );
}
