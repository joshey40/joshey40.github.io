const headerPattern = /^(Melee or Ranged|Melee|Ranged) Attack Roll: \+(\d+)(?: to hit)?(?: \((.+?)\))?, (?:reach (\d+) (?:ft\.|feet\.?)|range ([\d/]+) ft\.)\s+(?:Hit: )?(.*)$/s;
const damagePattern = /(\d+)(?: \((\d+d\d+)(?: ([+-]) (\d+))?\))? (\w+) damage/g;
const effectPattern = /^If (?:the )?target is (?:a )?(Tiny|Small|Medium|Large|Huge|Gargantuan) or smaller(?: creature)?(?: and the [\w ]+? moved (\d+)\+ feet straight toward it immediately before the hit)?, (?:the target|it) (.+?)\.(?: While Grappled, the target (.+?)\.)?$/;

export function parseAttack(description) {
  const header = String(description ?? "").match(headerPattern);
  if (!header) return null;
  const [, kind, toHit, toHitNote, reach, range, hitText] = header;
  const sentence = hitText.match(/^(.*?damage[^.]*)\.\s*(.*)$/s);
  if (!sentence) return null;
  const inserted = sentence[1].match(/—or (.+?)—/);
  const [main, alternative] = inserted ? [sentence[1].replace(inserted[0], " "), inserted[1]] : sentence[1].split(", or ");
  const damage = parseDamage(main);
  if (!damage.length) return null;
  const notes = [];
  if (alternative) notes.push(formatAlternative(alternative));
  if (toHitNote) notes.push(capitalize(toHitNote.replace(/^with /, "")));
  if (sentence[2]) notes.push(parseEffect(sentence[2]) ?? sentence[2]);
  return { kind, toHit: Number(toHit), distance: reach ? `${reach} ft.` : `${range} ft.`, damage, notes };
}

export function formatDamage(damage) {
  return damage.map((part) => `${part.dice ?? part.average} ${part.type}`).join(" + ");
}

export function parseEffect(text) {
  const match = text.match(effectPattern);
  if (!match) return null;
  const [, size, charge, consequence, whileGrappled] = match;
  let summary = summarizeConsequence(consequence);
  if (whileGrappled) summary += ` + ${summarizeConsequence(whileGrappled)}`;
  return `${charge ? `Charge ${charge}+ ft., ` : ""}≤ ${size}: ${summary}`;
}

function parseDamage(text) {
  return [...text.matchAll(damagePattern)].map(([, average, dice, sign, bonus, type]) => ({
    average: Number(average),
    dice: dice ? `${dice}${bonus ? `${sign}${bonus}` : ""}` : null,
    type,
  }));
}

function formatAlternative(text) {
  const [, damageText, condition] = text.match(/^(.*?damage) (if .+)$/) ?? [null, text, ""];
  const charge = condition.match(/moved (\d+)\+ feet straight toward/);
  const bloodied = condition.match(/^if the (\w+) is Bloodied$/);
  const label = charge ? `Charge ${charge[1]}+ ft.` : bloodied ? `${capitalize(bloodied[1])} Bloodied` : capitalize(condition);
  return `${label}: ${formatDamage(parseDamage(damageText))} instead`;
}

function summarizeConsequence(text) {
  return text
    .replace(/takes an extra \d+ \((\d+d\d+)\) (\w+) damage/g, "+$1 $2")
    .replace(/has the (\w+) condition(?: \(escape DC (\d+)\))?/g, (_, condition, dc) => dc ? `${condition} (DC ${dc})` : condition)
    .replace(/,? and /g, ", ");
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
