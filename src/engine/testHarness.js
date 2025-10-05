let turn = 0;
const MAX_TURNS = 500; // safety limit to prevent infinite loops

while (!engine.isGameOver() && turn < MAX_TURNS) {
  const currentPlayer = engine.getCurrentPlayer();
  console.log(`\n🎮 Turn ${turn + 1}: ${currentPlayer.id}'s turn`);
  const result = engine.takeTurn();

  if (result === 'NO_VALID_MOVES') {
    console.log('🃏 No valid moves. Drawing one card...');
    const drew = engine.drawCard(currentPlayer.id);
    if (!engine.canPlay(currentPlayer.id)) {
      console.log('🃏 Still no valid moves after drawing. Skipping turn.');
      engine.nextTurn();
    }
  }

  turn++;
}

if (turn >= MAX_TURNS) {
  console.log(`\n⚠️ Game auto-ended after ${MAX_TURNS} turns (stalemate detected).`);
} else {
  console.log('\n✅ Game over!');
}
process.exit(0);
