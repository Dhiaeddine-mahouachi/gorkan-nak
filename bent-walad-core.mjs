export const LETTERS = [..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];

export const STANDARD_CATEGORIES = Object.freeze([
  "اسم ولد",
  "اسم بنت",
  "حيوان",
  "مهنة",
  "بلد",
  "أكلة",
  "اسم مشهور",
  "جماد"
]);

export const OPTIONAL_CATEGORIES = Object.freeze([
  "نبات",
  "لون",
  "مدينة",
  "رياضة",
  "ماركة",
  "وسيلة نقل",
  "شخصية كرتونية",
  "فيلم أو مسلسل",
  "لباس",
  "عضو من الجسم"
]);

export const CATEGORY_OPTIONS = Object.freeze([
  ...STANDARD_CATEGORIES,
  ...OPTIONAL_CATEGORIES
]);
export const MAX_CATEGORIES = CATEGORY_OPTIONS.length;

const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const CATEGORY_SET = new Set(CATEGORY_OPTIONS);

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
  const count = Math.max(
    0,
    Math.min(MAX_CATEGORIES, Number(categoryCount) || 0)
  );
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) =>
    sanitizeAnswer(source[index])
  );
}

export function parseCategories(value) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[،,]/);
  const categories = [];

  source.forEach(item => {
    const category = String(item ?? "")
      .replace(CONTROL_CHARS, "")
      .trim()
      .slice(0, 32);
    if (
      CATEGORY_SET.has(category) &&
      !categories.includes(category) &&
      categories.length < MAX_CATEGORIES
    ) {
      categories.push(category);
    }
  });

  return categories.length >= 3
    ? categories
    : [...STANDARD_CATEGORIES];
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
      const hasHostDecision = Object.prototype.hasOwnProperty.call(
        validity,
        key
      );
      const accepted = hasHostDecision
        ? validity[key] === true
        : !duplicate && startsWithLetter(answer, letter);

      if (answer && accepted) {
        total += 1;
      }
    });

    points[playerId] = total;
  });

  return points;
}
