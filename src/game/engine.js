import { createDeck, dealCards } from "./deck.js";
import { sameColor } from "../utils/helpers.js";
import { CARDS_PER_PLAYER, ELIMINATION_LIMIT } from "../config/settings.js";
import { validateMove } from "./rules.js";
import { initState, applyMove } from "./state.js";

export class NikoJadiEngine {
  constructor() {
    this.state = initState();
  }

  processMove(playerId, move) {
    if (!validateMove(this.state, move, playerId)) {
      return { error: "Invalid move" };
    }
    this.state = applyMove(this.state, move);
    return this.state;
  }
}


export function createRoom(ownerId) {
  return {
    owner: ownerId,
    players: [ownerId],
    direction: 1, // 1 = clockwise, -1 = reverse
    turnIndex: 0,
    gameState: null,
    feeders: 0, // cards to pick
  };
}

export function joinRoom(rooms, roomId, playerId) {
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };
  if (room.players.includes(playerId)) return room;
  if (room.players.length >= 9) return { error: "Room full" };
  room.players.push(playerId);
  return room;
}

export function startGame(rooms, roomId) {
  const room = rooms[roomId];
  if (!room) return { error: "Room not found" };

  const deck = createDeck();
  const hands = dealCards(deck, room.players, CARDS_PER_PLAYER);

  room.gameState = {
    started: true,
    deck,
    pile: [], // played cards
    hands,
    nikoKadi: {}, // playerId -> boolean
    turnIndex: 0,
    direction: 1,
    feeders: 0,
    requestedSuit: null,
    winner: null,
  };

  return { message: "Game started", state: summarize(room) };
}

export function playCard(rooms, data, playerId) {
  const { roomId, card } = data;
  const room = rooms[roomId];
  if (!room || !room.gameState) return { error: "Game not started" };

  const state = room.gameState;
  const hand = state.hands[playerId];
  if (!hand) return { error: "Not in game" };

  const topCard = state.pile[state.pile.length - 1];
  const isPlayerTurn = room.players[state.turnIndex] === playerId;

  if (!isPlayerTurn) return { error: "Not your turn" };

  // ---- Validation ----
  const hasCard = hand.some(
    (c) => c.rank === card.rank && c.suit === card.suit
  );
  if (!hasCard) return { error: "You don't have that card" };

  const valid = isPlayable(card, topCard, state.requestedSuit, state.feeders);
  if (!valid) return { error: "Invalid move" };

  // ---- Play card ----
  removeCard(hand, card);
  state.pile.push(card);

  // Handle card effects
  handleCardEffect(room, playerId, card);

  // Elimination check
  if (hand.length > ELIMINATION_LIMIT) {
    delete state.hands[playerId];
    return { event: "eliminated", playerId };
  }

  // Check win condition
  if (hand.length === 0) {
    if (state.nikoKadi[playerId]) {
      state.winner = playerId;
      return { event: "winner", winner: playerId, summary: summarize(room) };
    } else {
      // player forgot to declare “niko kadi”
      drawCards(state.deck, hand, 1);
      return {
        warning: "Forgot to say Niko Kadi — drew 1 card",
        handSize: hand.length,
      };
    }
  }

  // Next turn
  advanceTurn(room);

  return {
    event: "cardPlayed",
    playerId,
    card,
    nextPlayer: room.players[room.turnIndex],
    state: summarize(room),
  };
}

export function declareNikoKadi(rooms, roomId, playerId) {
  const room = rooms[roomId];
  if (!room || !room.gameState) return { error: "Game not started" };
  room.gameState.nikoKadi[playerId] = true;
  return { message: "Niko Kadi declared" };
}

function handleCardEffect(room, playerId, card) {
  const state = room.gameState;

  switch (card.rank) {
    case "2":
      state.feeders += 2;
      break;
    case "3":
      state.feeders += 3;
      break;
    case "joker":
      state.feeders += 5;
      break;
    case "K":
      room.direction *= -1; // reverse
      if (state.feeders > 0) {
        // reflect feeders
        const prev = getNextIndex(room, -1);
        const target = room.players[prev];
        drawCards(state.deck, state.hands[target], state.feeders);
        state.feeders = 0;
      }
      break;
    case "J":
      room.turnIndex = getNextIndex(room, 2); // skip one player
      return;
    case "A":
      if (card.suit === "spades") {
        // Big Ace logic
        state.requestedSuit = null;
        state.feeders = 0;
      } else {
        state.feeders = 0;
      }
      break;
    default:
      state.requestedSuit = null;
      break;
  }
}

function isPlayable(card, topCard, requestedSuit, feeders) {
  if (!topCard) return true; // first move
  if (feeders > 0 && ["2", "3", "joker", "K", "A"].includes(card.rank))
    return true; // counter feeders
  if (requestedSuit && card.suit === requestedSuit) return true;
  if (card.rank === topCard.rank) return true;
  if (sameColor(card.suit, topCard.suit)) return true;
  return false;
}

function removeCard(hand, card) {
  const i = hand.findIndex((c) => c.rank === card.rank && c.suit === card.suit);
  if (i > -1) hand.splice(i, 1);
}

function drawCards(deck, hand, count) {
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) break;
    hand.push(deck.pop());
  }
}

function advanceTurn(room) {
  room.turnIndex = getNextIndex(room, 1);
}

function getNextIndex(room, step = 1) {
  const len = room.players.length;
  return (room.turnIndex + step * room.direction + len) % len;
}

function summarize(room) {
  const state = room.gameState;
  return {
    players: room.players.map((p) => ({
      id: p,
      cards: state.hands[p]?.length || 0,
      nikoKadi: !!state.nikoKadi[p],
    })),
    topCard: state.pile[state.pile.length - 1] || null,
    feeders: state.feeders,
    requestedSuit: state.requestedSuit,
    direction: room.direction,
    turn: room.players[room.turnIndex],
    winner: state.winner,
  };
}
