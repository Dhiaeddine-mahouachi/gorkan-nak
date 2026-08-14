export const LETTERS = [..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function normalizeArabic(value) {
  return String(value ?? "")
    .trim()
    .replace(/ـ/g, "")
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function startsWithLetter(value, letter) {
  const normalized = normalizeArabic(value);
  return Boolean(normalized) && normalized.startsWith(normalizeArabic(letter));
}

export function sanitizeName(value) {
  return String(value ?? "")
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, 24);
}

export function sanitizeAnswer(value) {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, "").slice(0, 80);
}

export function sanitizeAnswers(value, categoryCount) {
  const count = Math.max(0, Math.min(12, Number(categoryCount) || 0));
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) =>
    sanitizeAnswer(source[index])
  );
}

export function parseCategories(value) {
  const categories = String(value ?? "")
    .split(/[،,]/)
    .map(category => category.replace(CONTROL_CHARS, "").trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 12);

  return categories.length >= 3
    ? categories
    : ["اسم ولد", "اسم بنت", "حيوان", "مهنة", "بلد", "أكلة"];
}

export function getDuplicateCounts(categories, playerIds, answers) {
  const counts = new Map();

  categories.forEach((_, categoryIndex) => {
    playerIds.forEach(playerId => {
      const normalized = normalizeArabic(
        answers[playerId]?.[categoryIndex] ?? ""
      );
      if (!normalized) return;
      const key = `${categoryIndex}:${normalized}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });

  return counts;
}

export function calculateRoundPoints({
  playerIds,
  categories,
  answers,
  letter,
  validity = {}
}) {
  const duplicates = getDuplicateCounts(categories, playerIds, answers);
  const points = {};

  playerIds.forEach(playerId => {
    let total = 0;

    categories.forEach((_, categoryIndex) => {
      const answer = String(answers[playerId]?.[categoryIndex] ?? "").trim();
      const normalized = normalizeArabic(answer);
      const duplicate =
        Boolean(normalized) &&
        (duplicates.get(`${categoryIndex}:${normalized}`) ?? 0) > 1;
      const key = `${playerId}:${categoryIndex}`;

      if (
        answer &&
        !duplicate &&
        startsWithLetter(answer, letter) &&
        validity[key] !== false
      ) {
        total += 1;
      }
    });

    points[playerId] = total;
  });

  return points;
}
