#!/usr/bin/env node
import { NikoJadiEngine } from "../src/engine/index.js";

const game = new NikoJadiEngine(["p1", "p2", "p3", "p4"]);

console.log("🤖 Running NikoJadi Bot Simulation...");

let turnCount = 0;
const MAX_TURNS = 2000;
const drawTracker = new Map();

while (!game.isOver() && turnCount < MAX_TURNS) {
  const currentId = game.currentPlayer();
  const hand = game.getPlayerHand(currentId);
  const validMoves = game.getValidMoves(currentId);

  console.log(`\n🎮 Turn ${turnCount + 1}: ${currentId}'s turn`);
  console.log("Hand:", hand.join(", "));

  if (validMoves.length > 0) {
    // Bot plays the first valid card
    const move = validMoves[0];
    console.log(`✅ Playing ${move}`);
    game.processMove(currentId, { type: "play", card: move });
  } else {
    console.log("🃏 No valid moves. Drawing one card...");
    game.drawCard(currentId);

    const draws = (drawTracker.get(currentId) || 0) + 1;
    drawTracker.set(currentId, draws);

    const newValid = game.getValidMoves(currentId);
    if (newValid.length > 0) {
      const move = newValid[0];
      console.log(`✅ After drawing, playing ${move}`);
      game.processMove(currentId, { type: "play", card: move });
    } else {
      console.log("🃏 Still no valid moves after drawing. Skipping turn.");
      drawTracker.set(currentId, 0);
      game.advanceTurn();
    }
  }

  turnCount++;
}

console.log("\n🏁 Game Over (or stalemate).");
if (game.isOver()) {
  console.log(`Winner: ${game.getWinner()}`);
} else {
  console.log("⚠️ Stalemate detected — max turns reached.");
}

console.log("\n📊 Final Stats:");
for (const p of game.state.players) {
  const hand = game.getPlayerHand(p);
  console.log(`${p}: ${hand.length} cards left (${hand.join(", ")})`);
}

console.log(`\n🌀 Total turns played: ${turnCount}`);
