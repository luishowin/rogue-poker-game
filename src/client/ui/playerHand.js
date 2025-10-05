// src/client/ui/playerHand.js
import { createCardElement } from "./cardRenderer.js";

export function renderPlayerHand(container, cards) {
  container.innerHTML = ""; // Clear old hand

  const spread = 20; // degrees
  const center = (cards.length - 1) / 2;

  cards.forEach((card, i) => {
    const el = createCardElement(card);
    const angle = (i - center) * spread;

    el.style.transform = `rotate(${angle}deg) translateY(-10px)`;
    el.style.zIndex = i;
    el.style.cursor = "pointer";

    el.addEventListener("click", () => {
      el.classList.toggle("selected");
    });

    container.appendChild(el);
  });
}
