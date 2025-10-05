import { parseCard, sameColor, sameRank, isRed } from "./utils.js";

export const SPECIALS = {
  FEEDERS: ["2", "3", "BJ", "RJ"], // Jokers = BJ (black), RJ (red)
  SKIP: ["J"],
  REVERSE: ["K"],
  REQUEST: ["A"],
};

export function canPlayCard(card, topCard) {
  if (!topCard) return true; // first move
  const a = parseCard(card);
  const b = parseCard(topCard);

  // Joker: always playable on Joker of same color or any feeder stack
  if (SPECIALS.FEEDERS.includes(a.rank) && SPECIALS.FEEDERS.includes(b.rank)) return true;

  // Match by rank (e.g. J on J)
  if (sameRank(a.rank, b.rank)) return true;

  // Match by color (red on red, black on black)
  if (sameColor(a.suit, b.suit)) return true;

  return false;
}

/** Applies card effects (direction, skips, feeders) */
export function applyCardEffect(engine, player, card) {
  const { rank } = parseCard(card);
  const nextTurn = () => (engine.state.turn + engine.state.direction + engine.state.players.length) % engine.state.players.length;

  if (rank === "K") {
    // King reverses direction
    engine.state.direction *= -1;
    console.log("🔁 Direction reversed!");
  }

  if (rank === "J") {
    // Skip next player
    engine.state.turn = nextTurn(); // skip one
    console.log("⏭️  Skip!");
  }

  if (SPECIALS.FEEDERS.includes(rank)) {
    let feedAmount = rank === "2" ? 2 : rank === "3" ? 3 : 5;
    const target = engine.state.players[nextTurn()];
    console.log(`💥 Feeder played! ${target} picks ${feedAmount}`);
    engine.feedPlayer(target, feedAmount);
  }

  if (rank === "A") {
    console.log("🃏 Ace played: can request suit or extinguish feeder");
    // for now, just extinguish
    engine.state.feedStack = 0;
  }
}
