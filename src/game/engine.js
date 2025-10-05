import { createDeck, dealCards } from "./deck.js";

export function createRoom(ownerId) {
  return { players: [ownerId], owner: ownerId, gameState: null };
}

export function joinRoom(rooms, roomId, playerId) {
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };
  if (room.players.length >= 9) return { error: "Room full" };
  room.players.push(playerId);
  return room;
}

export function startGame(rooms, roomId) {
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };
  const deck = createDeck();
  const hands = dealCards(deck, room.players);
  room.gameState = { started: true, deck, hands, currentTurn: 0 };
  return room.gameState;
}

export function playCard(rooms, data, playerId) {
  const { roomId, card } = data;
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };
  // TODO: Apply rule logic
  return { message: `${playerId} played ${card}` };
}
