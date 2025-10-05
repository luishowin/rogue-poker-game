export function parseCard(card) {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  return { rank, suit };
}

export function isRed(suit) {
  return suit === "H" || suit === "D"; // Hearts & Diamonds
}

export function isBlack(suit) {
  return suit === "S" || suit === "C"; // Spades & Clubs
}

export function sameColor(s1, s2) {
  return (isRed(s1) && isRed(s2)) || (isBlack(s1) && isBlack(s2));
}

export function sameRank(r1, r2) {
  return r1 === r2;
}

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "BJ", "RJ"];
