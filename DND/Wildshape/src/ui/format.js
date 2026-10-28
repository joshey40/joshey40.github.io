const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]); }

export function formatMarkdown(value, highlight = false) {
  const strong = (text) => highlight ? `<span class="notes-highlight"><strong>${text}</strong></span>` : `<strong>${text}</strong>`;
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, (_, text) => strong(`<em>${text}</em>`))
    .replace(/\*\*(.+?)\*\*/g, (_, text) => strong(text))
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/(^|\W)_([^_\n]+?)_(?=\W|$)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}
