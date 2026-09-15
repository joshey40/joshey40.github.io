import { formatCR } from "../domain/wildshape.js";

export function renderBeastList(container, beasts, selectedId, bookmarks, onSelect, onToggleBookmark) {
  container.replaceChildren();
  const template = document.querySelector("#beast-card-template");
  for (const beast of beasts) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = beast.id;
    card.classList.toggle("is-selected", beast.id === selectedId);
    card.classList.toggle("is-bookmarked", bookmarks.has(beast.id));
    card.querySelector(".beast-card__name").textContent = beast.name;
    card.querySelector(".beast-card__cr").textContent = `CR ${formatCR(beast.challengeRating)}`;
    card.querySelector(".beast-card__meta").textContent = `${beast.size} · ${formatSpeed(beast.speed, beast.speedUnit)}`;
    card.querySelector(".beast-card-select").addEventListener("click", () => onSelect(beast.id));
    const bookmarkButton = card.querySelector(".bookmark-button");
    bookmarkButton.textContent = bookmarks.has(beast.id) ? "★" : "☆";
    bookmarkButton.setAttribute("aria-label", bookmarks.has(beast.id) ? "Remove bookmark" : "Add bookmark");
    bookmarkButton.title = bookmarks.has(beast.id) ? "Remove bookmark" : "Add bookmark";
    bookmarkButton.addEventListener("click", () => onToggleBookmark(beast.id));
    container.append(card);
  }
  if (!beasts.length) container.innerHTML = '<p class="empty-detail">No forms match these filters.</p>';
}

function formatSpeed(speed, unit) { return Object.entries(speed).map(([type, value]) => `${type}: ${value} ${unit}`).join(" · "); }
