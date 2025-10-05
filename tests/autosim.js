import { NikoJadiEngine } from "../src/engine/index.js";

const players = ["p1", "p2", "p3", "p4"];
const game = new NikoJadiEngine(players);

// Track per-player stats
const stats = Object.fromEntries(
  players.map(p => [p, { draws: 0, plays: 0, skips: 0 }])
);

let drawTracker = {};
let turnCount = 0;

function simulateTurn() {
  // End condition
  if (game.isOver()) {
    return endGame();
  }

  const player = game.currentPlayer();
  const hand = game.getPlayerHand(player);
  const validMoves = game.getValidMoves(player);
  turnCount++;

  console.log(`\n🎮 Turn ${turnCount}: ${player}'s turn`);
  console.log("Hand:", hand.join(", "));

  if (!(player in drawTracker)) drawTracker[player] = false;

  // 🃏 No valid moves
  if (validMoves.length === 0) {
    if (drawTracker[player]) {
      console.log("🃏 Still no valid moves after drawing. Skipping turn.");
      stats[player].skips++;
      drawTracker[player] = false;
      game.advanceTurn();
      return setTimeout(simulateTurn, 80);
    } else {
      console.log("🃏 No valid moves. Drawing one card...");
      game.drawCard(player);
      stats[player].draws++;
      drawTracker[player] = true;
      return setTimeout(simulateTurn, 80);
    }
  }

  // 🎴 Play a valid card
  const move = validMoves[Math.floor(Math.random() * validMoves.length)];
  console.log(`🎴 ${player} plays ${move}`);
  game.processMove(player, { type: "play", card: move });
  stats[player].plays++;
  drawTracker[player] = false;

  setTimeout(simulateTurn, 80);
}

function endGame() {
  const winner = game.getWinner();
  console.log(`\n🏁 Game Over! Winner: ${winner}`);
  console.log("───────────────────────────────");

  players.forEach((p) => {
    const s = stats[p];
    const hand = game.getPlayerHand(p);
    console.log(
      `${p.padEnd(4)} | Plays: ${s.plays.toString().padStart(3)} | Draws: ${s.draws.toString().padStart(3)} | Skips: ${s.skips.toString().padStart(3)} | Cards left: ${hand.length}`
    );
  });

  console.log("───────────────────────────────");
  console.log(`🕒 Total turns played: ${turnCount}`);
  console.log(`🏆 Winner: ${winner}`);
  process.exit(0);
}

simulateTurn();
