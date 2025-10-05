export function sameColor(suit1, suit2) {
  const red = ["hearts", "diamonds"];
  const black = ["clubs", "spades"];
  return (
    (red.includes(suit1) && red.includes(suit2)) ||
    (black.includes(suit1) && black.includes(suit2))
  );
}
