#!/usr/bin/env node
import { NikoJadiEngine } from "../src/engine/index.js";

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateGame() {
  const game = new NikoJadiEngine(["p1", "p2", "p3", "p4"]);
  console.log("🤖 Starting NikoJadi auto-sim test\n");

  let round = 1;
  while (!game.isOver()) {
    const currentPlayer = game.currentPlayer();
    const hand = game.getPlayerHand(currentPlayer);
    const validMoves = game.getValidMoves(currentPlayer);

    console.log(`\nRound ${round++}: ${currentPlayer}'s turn`);
    console.log(`Hand: ${hand.join(", ")}`);

    if (hand.length > 10) {
      console.log(`💀 ${currentPlayer} eliminated (too many cards)`);
      game.eliminate(currentPlayer);
      continue;
    }

    if (validMoves.length === 0) {
      console.log(`🃏 ${currentPlayer} has no valid moves. Drawing...`);
      game.drawCard(currentPlayer);
    } else {
      const move = getRandomItem(validMoves);
      const result = game.processMove(currentPlayer, { type: "play", card: move });
      console.log(`→ ${currentPlayer} played ${move}`, result ? "" : "(invalid)");
    }

    await delay(400); // Small delay for readability
  }

  console.log("\n🏁 Game over!");
  console.log("Winner:", game.getWinner());
  console.dir(game.state, { depth: null });
}

simulateGame();
