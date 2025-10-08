import express from "express";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* ---------- Utility Functions ---------- */

function makeDeck() {
  const colors = ["red", "green", "blue", "yellow"];
  const ranks = ["1","2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  let deck = [];
  for (const c of colors)
    for (const r of ranks) deck.push(`${c}_${r}`);
  deck.push("Joker_black", "Joker_red"); // two jokers
  return deck.sort(() => Math.random() - 0.5);
}

function draw(deck, n) {
  return deck.splice(0, n);
}

function matchCard(card, top, requestedSuit) {
  if (!top) return true;
  const [cColor, cRank] = card.split("_");
  const [tColor, tRank] = top.split("_");
  if (requestedSuit) return cColor === requestedSuit;
  return cColor === tColor || cRank === tRank;
}

/* ---------- Game Engine ---------- */

const rooms = {}; // roomCode -> room state

function initRoom(roomCode, hostId) {
  rooms[roomCode] = {
    hostId,
    players: [],
    deck: [],
    discard: [],
    turn: 0,
    direction: 1,
    feedCount: 0,
    feedActive: false,
    requestedSuit: null,
    skipNext: false,
    phase: "lobby"
  };
}

function applyCardEffect(room, player, card) {
  const [color, rank] = card.split("_");

  switch (rank) {
    case "2": room.feedCount += 2; room.feedActive = true; break;
    case "3": room.feedCount += 3; room.feedActive = true; break;
    case "Joker": room.feedCount += 5; room.feedActive = true; break;
    case "K":
      room.direction *= -1; // reverse or reflect
      break;
    case "J":
      room.skipNext = true;
      break;
    case "A":
      if (room.feedActive) {
        room.feedCount = 0;
        room.feedActive = false;
      } else {
        // ask the player client for suit — for now, clear any pending suit
        room.requestedSuit = null;
      }
      break;
  }
}

function nextTurnIndex(room) {
  let i = room.turn + room.direction;
  if (room.skipNext) {
    i += room.direction;
    room.skipNext = false;
  }
  i = (i + room.players.length) % room.players.length;
  return i;
}

/* ---------- Socket.IO Handlers ---------- */

io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

socket.on('createRoom', (name) => {
  const roomId = generateRoomId();
  rooms[roomId] = {
    id: roomId,
    players: {},
    started: false,
    deck: [],
    topCard: null,
    turnPlayer: null,
  };

  players[socket.id] = { id: socket.id, name, roomId, hand: [] };
  rooms[roomId].players[socket.id] = players[socket.id];

  socket.join(roomId);

  // ✅ Send both playerId and roomId
  socket.emit('roomCreated', { playerId: socket.id, roomId });
  console.log(`Room ${roomId} created by ${name}`);
});


  socket.on("joinRoom", (code) => {
    const room = rooms[code];
    if (!room) return socket.emit("errorMsg", "Room not found.");
    room.players.push({ id: socket.id, hand: [], declared: false });
    socket.join(code);
    io.to(code).emit("playerJoined", socket.id);
    console.log(`✅ ${socket.id} joined ${code}`);
  });

  socket.on("startGame", (code) => {
    const room = rooms[code];
    if (!room) return;

    room.deck = makeDeck();
    room.players.forEach(p => p.hand = draw(room.deck, 5));
    room.discard.push(room.deck.pop());
    room.turn = Math.floor(Math.random() * room.players.length);
    room.phase = "playing";

    io.to(code).emit("gameStarted", {
      players: room.players.map(p => ({ id: p.id, count: p.hand.length })),
      topCard: room.discard.at(-1),
      turn: room.players[room.turn].id
    });

    console.log("🎮 Game started in room", code);
  });

  socket.on("playCard", ({ code, cards }) => {
    const room = rooms[code];
    if (!room || room.phase !== "playing") return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Turn validation
    if (room.players[room.turn].id !== socket.id)
      return socket.emit("errorMsg", "Not your turn.");

    // Card validation
    for (const c of cards) {
      if (!player.hand.includes(c))
        return socket.emit("errorMsg", "Invalid card.");
    }

    const top = room.discard.at(-1);
    if (!cards.some(c => matchCard(c, top, room.requestedSuit)))
      return socket.emit("errorMsg", "Card doesn’t match.");

    // Apply effects and update state
    for (const c of cards) applyCardEffect(room, player, c);
    player.hand = player.hand.filter(c => !cards.includes(c));
    room.discard.push(...cards);
    room.requestedSuit = null; // clear after use

    // Check for Niko Kadi declaration logic
    if (player.hand.length === 1 && !player.declared) {
      player.mustDeclare = true;
    } else if (player.hand.length === 0 && player.declared) {
      room.phase = "ended";
      io.to(code).emit("gameEnded", { winner: socket.id });
      console.log(`🏆 ${socket.id} wins in ${code}`);
      return;
    }

    // Turn rotation
    room.turn = nextTurnIndex(room);

    io.to(code).emit("gameState", {
      topCard: room.discard.at(-1),
      turn: room.players[room.turn].id,
      feedCount: room.feedCount,
      feedActive: room.feedActive,
      direction: room.direction,
      players: room.players.map(p => ({ id: p.id, count: p.hand.length }))
    });

    console.log(`${socket.id} played ${cards.join(", ")} in room ${code}`);
  });

  socket.on("declare", (code) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.declared = true;
      socket.emit("declaredOK");
    }
  });

  socket.on("drawCard", (code) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const drawn = draw(room.deck, 1);
    player.hand.push(...drawn);
    socket.emit("cardDrawn", drawn);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
    for (const [code, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) delete rooms[code];
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
