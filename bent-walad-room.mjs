const RECONNECT_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const STORAGE_PREFIX = "bent-walad-player-v1";

export function sanitizeReconnectToken(value) {
  const token = String(value ?? "").trim().toLowerCase();
  return RECONNECT_TOKEN_PATTERN.test(token) ? token : "";
}

export function createReconnectToken(
  fillRandom = bytes => globalThis.crypto.getRandomValues(bytes)
) {
  const bytes = new Uint8Array(16);
  fillRandom(bytes);
  return [...bytes]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

export function getReconnectToken(
  roomCode,
  playerName,
  { storage = globalThis.localStorage, fillRandom } = {}
) {
  const key = `${STORAGE_PREFIX}:${String(roomCode)}`;
  const name = String(playerName ?? "");

  try {
    const saved = JSON.parse(storage?.getItem(key) || "null");
    const savedToken = sanitizeReconnectToken(saved?.token);
    if (savedToken && saved?.name === name) return savedToken;
  } catch {}

  const token = createReconnectToken(fillRandom);
  try {
    storage?.setItem(key, JSON.stringify({ name, token }));
  } catch {}
  return token;
}

function moveObjectEntry(object, previousId, nextId) {
  if (!object || !Object.prototype.hasOwnProperty.call(object, previousId)) {
    return;
  }
  object[nextId] = object[previousId];
  delete object[previousId];
}

export function rebindPlayerState({
  players,
  previousId,
  nextId,
  allAnswers,
  roundPoints,
  validity,
  roundSubmissions,
  stoppedById
}) {
  const player = players?.get(previousId);
  if (!player || !nextId) return { moved: false, stoppedById };

  if (previousId !== nextId) {
    players.delete(previousId);
    players.set(nextId, { ...player, id: nextId, online: true });
    moveObjectEntry(allAnswers, previousId, nextId);
    moveObjectEntry(roundPoints, previousId, nextId);

    const validityPrefix = `${previousId}:`;
    Object.keys(validity || {}).forEach(key => {
      if (!key.startsWith(validityPrefix)) return;
      const nextKey = `${nextId}:${key.slice(validityPrefix.length)}`;
      validity[nextKey] = validity[key];
      delete validity[key];
    });

    if (roundSubmissions?.delete(previousId)) {
      roundSubmissions.add(nextId);
    }
  } else {
    players.set(nextId, { ...player, online: true });
  }

  return {
    moved: true,
    stoppedById: stoppedById === previousId ? nextId : stoppedById
  };
}
