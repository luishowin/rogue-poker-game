// src/client/ui/cardRenderer.js
export function createCardElement(card) {
  const el = document.createElement("div");
  el.classList.add("card");

  const rank = card.rank || "?";
  const suit = card.suit || "?";
  const isRed = suit === "♥" || suit === "♦";

  el.innerHTML = `
    <div class="card-inner ${isRed ? "red" : "black"}">
      <div class="card-rank">${rank}</div>
      <div class="card-suit">${suit}</div>
    </div>
  `;

  return el;
}
