export function inRange(value, min, max) { return (min === "" || value >= Number(min)) && (max === "" || value <= Number(max)); }

export function matchesAll(values, requested) { return requested.every((value) => values.includes(value)); }

export function meetsMinimums(values, minimums) { return minimums.every(([key, minimum]) => (values[key] ?? 0) >= Math.max(1, minimum)); }
