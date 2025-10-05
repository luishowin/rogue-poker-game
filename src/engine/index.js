export class NikoJadiEngine {
  constructor() {
    this.state = {
      deck: ["AH", "2H", "3H", "4C", "5D"],
      players: ["p1", "p2"],
      turn: 0,
      moves: [],
    };
  }

  processMove(playerId, move) {
    const currentPlayer = this.state.players[this.state.turn];
    if (playerId !== currentPlayer) {
      return { error: "Not your turn." };
    }

    // Simplified rule — just log the move
    this.state.moves.push({ player: playerId, card: move.card });

    // Rotate turn
    this.state.turn = (this.state.turn + 1) % this.state.players.length;

    return { success: true, next: this.state.players[this.state.turn] };
  }
}
