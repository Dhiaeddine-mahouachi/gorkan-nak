import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateRoundPoints,
  normalizeArabic,
  parseCategories,
  sanitizeAnswers,
  sanitizeName,
  startsWithLetter
} from "../bent-walad-core.mjs";

test("Arabic normalization handles common equivalent forms", () => {
  assert.equal(normalizeArabic("  إِبْرَاهِيمـ  "), "ابراهيم");
  assert.equal(normalizeArabic("مُصْطَفَى"), "مصطفي");
  assert.equal(normalizeArabic("بيت   كبير"), "بيت كبير");
});

test("letter validation uses normalized Arabic", () => {
  assert.equal(startsWithLetter("أسد", "ا"), true);
  assert.equal(startsWithLetter("  بطة", "ب"), true);
  assert.equal(startsWithLetter("تونس", "ب"), false);
  assert.equal(startsWithLetter("", "ب"), false);
});

test("category parsing accepts Arabic and Latin commas and has a safe fallback", () => {
  assert.deepEqual(parseCategories("ولد، بنت, حيوان"), ["ولد", "بنت", "حيوان"]);
  assert.equal(parseCategories("واحد، اثنين").length, 6);
  assert.equal(parseCategories(Array(20).fill("خانة").join("،")).length, 12);
});

test("network text is bounded and non-string answers are rejected", () => {
  assert.equal(sanitizeName("  ضياء\u0000  "), "ضياء");
  assert.deepEqual(sanitizeAnswers(["تونس", { unsafe: true }, 42], 3), [
    "تونس",
    "",
    ""
  ]);
  assert.equal(sanitizeAnswers(["ا".repeat(120)], 1)[0].length, 80);
});

test("scoring rejects blanks, wrong letters, duplicates, and manual rejections", () => {
  const points = calculateRoundPoints({
    playerIds: ["p1", "p2", "p3"],
    categories: ["بلد", "حيوان", "اسم"],
    answers: {
      p1: ["تونس", "تمساح", "تامر"],
      p2: [" تُونِس ", "تفاحة", ""],
      p3: ["تركيا", "تمساح", "بشير"]
    },
    letter: "ت",
    validity: { "p1:2": false }
  });

  assert.deepEqual(points, { p1: 0, p2: 1, p3: 1 });
});
