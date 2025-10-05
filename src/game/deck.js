export function createDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  // Add jokers
  deck.push({ suit: "joker", rank: "joker" });
  deck.push({ suit: "joker", rank: "joker" });

  return shuffle(deck);
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealCards(deck, players, cardsPerPlayer = 5) {
  const hands = {};
  for (let player of players) {
    hands[player] = deck.splice(0, cardsPerPlayer);
  }
  return hands;
}
