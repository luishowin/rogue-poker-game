// src/engine/index.js
export class Game {
  constructor() {
    this.deck = this.generateDeck();
    this.discard = [];
    this.players = [];
    this.currentPlayer = 0;
    this.direction = 1; // 1 = clockwise, -1 = reverse
    this.started = false;
  }

  generateDeck() {
    const colors = ["red", "green", "blue", "yellow"];
    const values = ["0","1","2","3","4","5","6","7","8","9","Reverse","Skip","+2"];
    let deck = [];
    for (const c of colors) {
      for (const v of values) deck.push({ color: c, value: v });
    }
    deck.push({ color: "wild", value: "+4" });
    deck.push({ color: "wild", value: "wild" });
    return deck.sort(() => Math.random() - 0.5);
  }

  addPlayer(id) {
    this.players.push({ id, hand: [] });
  }

  start() {
    this.started = true;
    for (const p of this.players) {
      p.hand = this.deck.splice(0, 7);
    }
    this.discard.push(this.deck.pop());
  }

  current() {
    return this.players[this.currentPlayer];
  }

  canPlay(card) {
    const top = this.discard[this.discard.length - 1];
    return (
      card.color === top.color ||
      card.value === top.value ||
      card.color === "wild"
    );
  }

  playCard(playerId, card) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not found" };

    const idx = player.hand.findIndex(
      (c) => c.color === card.color && c.value === card.value
    );
    if (idx === -1) return { error: "Card not in hand" };
    if (!this.canPlay(card)) return { error: "Invalid move" };

    player.hand.splice(idx, 1);
    this.discard.push(card);

    if (card.value === "Reverse") this.direction *= -1;
    if (card.value === "Skip") this.nextPlayer();
    this.nextPlayer();

    return { success: true };
  }

  nextPlayer() {
    const total = this.players.length;
    this.currentPlayer =
      (this.currentPlayer + this.direction + total) % total;
  }
}
