export function inRange(value, min, max) { return (min === "" || value >= Number(min)) && (max === "" || value <= Number(max)); }

export function matchesSearch(beast, query, includeDetails = false) {
  if (!query) return true;
  const texts = [beast.name, ...(includeDetails ? [...(beast.traits ?? []), ...beast.actions].flatMap((entry) => [entry.name, entry.description]) : [])];
  return texts.some((text) => String(text ?? "").toLocaleLowerCase().includes(query));
}

export function matchesAll(values, requested) { return requested.every((value) => values.includes(value)); }

export function meetsMinimums(values, minimums) { return minimums.every(([key, minimum]) => (values[key] ?? 0) >= Math.max(1, minimum)); }
