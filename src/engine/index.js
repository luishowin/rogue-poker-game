import { canPlayCard, applyCardEffect } from "./rules.js";
import { parseCard } from "./utils.js";

export class NikoJadiEngine {
  constructor(players = ["p1", "p2"]) {
    this.state = {
      players,
      turn: 0,
      direction: 1, // 1 = clockwise, -1 = counterclockwise
      deck: this.generateDeck(),
      hands: {},
      moves: [],
      winner: null,
      feedStack: 0,
      nikoDeclared: {}, // track who said "Niko kadi"
    };

    // deal 5 cards each
    players.forEach((p) => {
      this.state.hands[p] = this.state.deck.splice(0, 5);
      this.state.nikoDeclared[p] = false;
    });
  }

  /** Create a simple 52 + 2 jokers deck */
  generateDeck() {
    const suits = ["H", "D", "C", "S"];
    const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    const deck = [];
    suits.forEach((s) => ranks.forEach((r) => deck.push(`${r}${s}`)));
    deck.push("BJ"); // black joker
    deck.push("RJ"); // red joker
    return deck.sort(() => Math.random() - 0.5);
  }

  currentPlayer() {
    return this.state.players[this.state.turn];
  }

  getPlayerHand(p) {
    return this.state.hands[p] || [];
  }

  getValidMoves(p) {
    const hand = this.state.hands[p];
    const topCard = this.state.moves.at(-1)?.card;
    return hand.filter((c) => canPlayCard(c, topCard));
  }

  drawCard(p, n = 1) {
    for (let i = 0; i < n && this.state.deck.length > 0; i++) {
      this.state.hands[p].push(this.state.deck.pop());
    }
  }

  feedPlayer(p, n) {
    this.drawCard(p, n);
  }

  processMove(player, { type, card }) {
    if (type === "declare") {
      this.state.nikoDeclared[player] = true;
      return { success: true, message: "Declared Niko kadi" };
    }

    if (type !== "play") return false;

    const hand = this.state.hands[player];
    const topCard = this.state.moves.at(-1)?.card;
    const valid = canPlayCard(card, topCard);
    if (!valid) return { error: "Invalid move." };

    const idx = hand.indexOf(card);
    if (idx === -1) return { error: "Card not in hand." };

    hand.splice(idx, 1);
    this.state.moves.push({ player, card });

    applyCardEffect(this, player, card);

    if (hand.length === 1 && !this.state.nikoDeclared[player]) {
      console.log(`⚠️ ${player} must declare Niko kadi before next turn`);
    }

    if (hand.length === 0) {
      if (this.state.nikoDeclared[player]) {
        this.state.winner = player;
      } else {
        console.log(`🚫 ${player} forgot to declare Niko kadi!`);
        this.drawCard(player); // penalty
      }
    }

    this.advanceTurn();
    return { success: true };
  }

  advanceTurn() {
    const n = this.state.players.length;
    this.state.turn = (this.state.turn + this.state.direction + n) % n;
  }

  eliminate(p) {
    delete this.state.hands[p];
    this.state.players = this.state.players.filter((x) => x !== p);
    if (this.state.turn >= this.state.players.length) this.state.turn = 0;
  }

  isOver() {
    return !!this.state.winner || this.state.players.length <= 1;
  }

  getWinner() {
    return this.state.winner || this.state.players[0];
  }
}
export function isGameOver() {
  // Example condition — customize for your game’s logic
  return players.some(p => p.hand.length === 0);
}

