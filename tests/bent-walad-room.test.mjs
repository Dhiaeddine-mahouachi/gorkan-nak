import test from "node:test";
import assert from "node:assert/strict";

import {
  createReconnectToken,
  getReconnectToken,
  rebindPlayerState,
  sanitizeReconnectToken
} from "../bent-walad-room.mjs";

test("reconnect tokens are validated and reused for the same player", () => {
  const values = Array.from({ length: 16 }, (_, index) => index);
  const token = createReconnectToken(bytes => bytes.set(values));
  assert.equal(token, "000102030405060708090a0b0c0d0e0f");
  assert.equal(sanitizeReconnectToken(token.toUpperCase()), token);
  assert.equal(sanitizeReconnectToken("not-a-token"), "");

  const valuesByKey = new Map();
  const storage = {
    getItem: key => valuesByKey.get(key) ?? null,
    setItem: (key, value) => valuesByKey.set(key, value)
  };
  const first = getReconnectToken("123456", "ضياء", {
    storage,
    fillRandom: bytes => bytes.fill(7)
  });
  const second = getReconnectToken("123456", "ضياء", {
    storage,
    fillRandom: bytes => bytes.fill(9)
  });
  const otherName = getReconnectToken("123456", "علي", {
    storage,
    fillRandom: bytes => bytes.fill(9)
  });

  assert.equal(first, "07".repeat(16));
  assert.equal(second, first);
  assert.equal(otherName, "09".repeat(16));
});

test("rejoining with a new peer id preserves score and round state", () => {
  const players = new Map([
    ["host", { id: "host", name: "Host", score: 4, online: true }],
    ["old-peer", { id: "old-peer", name: "Guest", score: 3, online: false }]
  ]);
  const allAnswers = { "old-peer": ["تونس"] };
  const roundPoints = { "old-peer": 2 };
  const validity = { "old-peer:0": true, "host:0": false };
  const roundSubmissions = new Set(["old-peer"]);

  const result = rebindPlayerState({
    players,
    previousId: "old-peer",
    nextId: "new-peer",
    allAnswers,
    roundPoints,
    validity,
    roundSubmissions,
    stoppedById: "old-peer"
  });

  assert.deepEqual(result, { moved: true, stoppedById: "new-peer" });
  assert.equal(players.has("old-peer"), false);
  assert.deepEqual(players.get("new-peer"), {
    id: "new-peer",
    name: "Guest",
    score: 3,
    online: true
  });
  assert.deepEqual(allAnswers, { "new-peer": ["تونس"] });
  assert.deepEqual(roundPoints, { "new-peer": 2 });
  assert.deepEqual(validity, { "new-peer:0": true, "host:0": false });
  assert.deepEqual([...roundSubmissions], ["new-peer"]);
});
