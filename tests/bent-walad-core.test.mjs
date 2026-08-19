import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CATEGORY_OPTIONS,
  MAX_CATEGORIES,
  OPTIONAL_CATEGORIES,
  STANDARD_CATEGORIES,
  calculateRoundPoints,
  normalizeArabic,
  parseCategories,
  sanitizeAnswers,
  sanitizeName,
  startsWithLetter
} from "../bent-walad-core.mjs";

const gameHtml = readFileSync(
  new URL("../bent-walad.html", import.meta.url),
  "utf8"
);
const gameAudioModule = readFileSync(
  new URL("../bent-walad-audio.mjs", import.meta.url),
  "utf8"
);

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

test("letter validation accepts common Arabic and Latin equivalents", () => {
  assert.equal(startsWithLetter("سمك", "س"), true);
  assert.equal(startsWithLetter("Sardine", "س"), true);
  assert.equal(startsWithLetter("City", "س"), true);
  assert.equal(startsWithLetter("chat", "ش"), true);
  assert.equal(startsWithLetter("7amama", "ح"), true);
  assert.equal(startsWithLetter("hotel", "ح"), true);
  assert.equal(startsWithLetter("hotel", "ه"), true);
  assert.equal(startsWithLetter("this", "ذ"), true);
  assert.equal(startsWithLetter("banana", "س"), false);
});

test("guest answers and review decisions reset for every new round", () => {
  assert.match(gameHtml, /const isNewRound = nextRound !== previousRound/);
  assert.match(gameHtml, /myAnswers = Array\(nextCategories\.length\)\.fill\(""\)/);
  assert.match(gameHtml, /if \(enteringReview\) \{[\s\S]*?validity = \{\}/);
  assert.match(gameHtml, /!isNewRound && status === "playing"/);
});

test("same-room replay and automatic one-minute countdown are wired", () => {
  assert.match(gameHtml, /id="lobbyRoundCount"/);
  assert.match(gameHtml, /id="roundTimer"/);
  assert.match(gameHtml, /Date\.now\(\) \+ 60_000/);
  assert.match(gameHtml, /beginRoundEnd\(selfId,[^\n]+true\)/);
  assert.match(gameHtml, /انتهى الوقت/);
});

test("category options provide 8 checked standards and 10 optional choices", () => {
  assert.deepEqual(STANDARD_CATEGORIES, [
    "اسم ولد",
    "اسم بنت",
    "حيوان",
    "مهنة",
    "بلد",
    "أكلة",
    "اسم مشهور",
    "جماد"
  ]);
  assert.equal(OPTIONAL_CATEGORIES.length, 10);
  assert.equal(CATEGORY_OPTIONS.length, 18);
  assert.equal(MAX_CATEGORIES, 18);
});

test("room setup renders category checkboxes with only standards preselected", () => {
  const checkboxPattern =
    /<input type="checkbox" name="category" value="([^"]+)"([^>]*)\/>/g;
  const checkboxes = [...gameHtml.matchAll(checkboxPattern)];

  assert.deepEqual(
    checkboxes.map(match => match[1]),
    CATEGORY_OPTIONS
  );
  assert.deepEqual(
    checkboxes.filter(match => /\bchecked\b/.test(match[2])).map(match => match[1]),
    STANDARD_CATEGORIES
  );
  assert.equal(gameHtml.includes('id="categories"'), false);
});

test("category parsing keeps valid checkbox choices and rejects unsafe values", () => {
  assert.deepEqual(
    parseCategories(["اسم ولد", "حيوان", "نبات", "نبات", "خانة مزيفة"]),
    ["اسم ولد", "حيوان", "نبات"]
  );
  assert.deepEqual(
    parseCategories("اسم ولد، اسم بنت, حيوان"),
    ["اسم ولد", "اسم بنت", "حيوان"]
  );
  assert.deepEqual(parseCategories(["نبات", "لون"]), STANDARD_CATEGORIES);
  assert.equal(parseCategories(CATEGORY_OPTIONS).length, 18);
});

test("Arabic comic artwork replaces emoji with local geometric motifs", () => {
  const emojiOrDingbat =
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

  assert.equal(emojiOrDingbat.test(gameHtml), false);
  assert.match(gameHtml, /id="icon-star8"/);
  assert.match(gameHtml, /id="icon-arch"/);
  assert.match(gameHtml, /id="icon-pen"/);
  assert.match(gameHtml, /class="comicWord">يلا<\/span>/);
  assert.match(gameHtml, /class="resultWord">مبروك<\/span>/);
});

test("Arabic-style soundtrack and interaction sounds are wired locally", () => {
  assert.match(gameHtml, /id="soundToggle"/);
  assert.match(gameHtml, /createGameAudio/);
  assert.match(gameHtml, /gameAudio\.play\("type"\)/);
  assert.match(gameHtml, /gameAudio\.play\(button\.id === "stopBtn"/);
  assert.match(gameAudioModule, /HIJAZ_SCALE/);
  assert.match(gameAudioModule, /HIJAZ_MELODY/);
  assert.match(gameAudioModule, /function frameDrum/);
  assert.match(gameAudioModule, /kind === "word-win"/);
  assert.match(gameAudioModule, /kind === "word-lose"/);
  assert.equal(/https?:\/\//.test(gameAudioModule), false);
});

test("review uses two decision buttons with win and loss feedback", () => {
  assert.match(gameHtml, /acceptDecision/);
  assert.match(gameHtml, /rejectDecision/);
  assert.match(gameHtml, /wordAccepted/);
  assert.match(gameHtml, /wordRejected/);
  assert.match(gameHtml, /gameAudio\.play\("word-win"\)/);
  assert.match(gameHtml, /gameAudio\.play\("word-lose"\)/);
  assert.match(gameHtml, /id="audioGate"/);
});

test("opening prompt and brand mark do not use the old letter logo", () => {
  assert.match(gameHtml, /id="audioGateBtn"[^>]*>[\s\S]*اضغط للبدء<\/button>/);
  assert.match(gameHtml, /class="logoMark"/);
  assert.doesNotMatch(gameHtml, /class="logo">ب و<\/div>/);
});

test("network text is bounded and non-string answers are rejected", () => {
  assert.equal(sanitizeName("  ضياء\u0000  "), "ضياء");
  assert.deepEqual(sanitizeAnswers(["تونس", { unsafe: true }, 42], 3), [
    "تونس",
    "",
    ""
  ]);
  assert.equal(sanitizeAnswers(["ا".repeat(120)], 1)[0].length, 80);
  assert.equal(sanitizeAnswers(Array(30).fill("جواب"), 30).length, 18);
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

test("the host can explicitly accept or reject an automatically judged word", () => {
  const points = calculateRoundPoints({
    playerIds: ["p1", "p2"],
    categories: ["بلد", "حيوان"],
    answers: {
      p1: ["تونس", "بطة"],
      p2: ["تونس", "تمساح"]
    },
    letter: "ت",
    validity: {
      "p1:0": true,
      "p1:1": false,
      "p2:0": false,
      "p2:1": true
    }
  });

  assert.deepEqual(points, { p1: 1, p2: 1 });
});
