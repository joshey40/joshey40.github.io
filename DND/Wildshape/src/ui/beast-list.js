import { formatCR } from "../domain/wildshape.js";

export function renderBeastList(container, beasts, selectedId, onSelect) {
  container.replaceChildren();
  const template = document.querySelector("#beast-card-template");
  for (const beast of beasts) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = beast.id;
    card.classList.toggle("is-selected", beast.id === selectedId);
    card.querySelector(".beast-card__name").textContent = beast.name;
    card.querySelector(".beast-card__cr").textContent = `HG ${formatCR(beast.challengeRating)}`;
    card.querySelector(".beast-card__meta").textContent = `${beast.size} · ${formatSpeed(beast.speed, beast.speedUnit)}`;
    card.addEventListener("click", () => onSelect(beast.id));
    container.append(card);
  }
  if (!beasts.length) container.innerHTML = '<p class="empty-detail">Keine Formen passen zu diesen Filtern.</p>';
}

function formatSpeed(speed, unit) { return Object.entries(speed).map(([type, value]) => `${type}: ${value} ${unit}`).join(" · "); }
