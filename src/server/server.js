import { Game } from "../engine/index.js";
import { Server } from "socket.io";

const io = new Server(3000, { cors: { origin: "*" } });
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  socket.on("createRoom", (code) => {
    const game = new Game();
    game.addPlayer(socket.id);
    rooms.set(code, game);
    socket.join(code);
    socket.emit("roomCreated", code);
    console.log("✅ Room created:", code);
  });

  socket.on("joinRoom", (code) => {
    const game = rooms.get(code);
    if (!game) return socket.emit("error", "Room not found");
    game.addPlayer(socket.id);
    socket.join(code);
    socket.emit("roomJoined", code);
    console.log("👥", socket.id, "joined", code);
  });

  socket.on("startGame", (code) => {
    const game = rooms.get(code);
    if (!game) return;
    game.start();
    io.to(code).emit("startGame", game.players[0].hand);
    console.log("🎮 Game started in room", code);
  });

  socket.on("playCard", ({ room, card }) => {
    const game = rooms.get(room);
    if (!game) return;
    const result = game.playCard(socket.id, card);
    if (result.error) return socket.emit("message", result.error);
    io.to(room).emit("stateUpdate", {
      topCard: game.discard[game.discard.length - 1],
      current: game.current().id,
    });
    console.log(`${socket.id} played ${card.color} ${card.value}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

console.log("Server running on :3000");
