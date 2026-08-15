const DEFAULT_POLL_MS = 650;
const DEFAULT_HIDDEN_POLL_MS = 1_500;
const DEFAULT_TIMEOUT_MS = 8_000;

function randomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

export const selfId = `bw-${randomHex()}`;

export function extractRoomCode(roomName) {
  return String(roomName ?? "").match(/(\d{6})$/)?.[1] || "";
}

export function normalizeRelayUrl(value) {
  const url = new URL(String(value ?? ""));
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Relay URL must use HTTP or HTTPS");
  }
  return url.href.replace(/\/$/, "");
}

class RelayRequestError extends Error {
  constructor(message, { code = "RELAY_ERROR", status = 0 } = {}) {
    super(message);
    this.name = "RelayRequestError";
    this.code = code;
    this.status = status;
  }
}

async function requestJson({
  fetchImpl,
  relayUrl,
  roomCode,
  operation,
  body,
  timeoutMs
}) {
  const controller = new AbortController();
  const timer = timeoutMs
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : 0;

  try {
    const response = await fetchImpl(
      `${relayUrl}/api/rooms/${roomCode}/${operation}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal
      }
    );
    let payload = null;
    try {
      payload = await response.json();
    } catch {}
    if (!response.ok || payload?.ok === false) {
      throw new RelayRequestError(
        payload?.message || `Relay request failed (${response.status})`,
        {
          code: payload?.code || "RELAY_HTTP_ERROR",
          status: response.status
        }
      );
    }
    return payload || { ok: true };
  } catch (error) {
    if (error instanceof RelayRequestError) throw error;
    const timedOut = error?.name === "AbortError";
    throw new RelayRequestError(
      timedOut ? "Relay request timed out" : "Could not reach room relay",
      { code: timedOut ? "RELAY_TIMEOUT" : "RELAY_NETWORK_ERROR" }
    );
  } finally {
    if (timer) globalThis.clearTimeout(timer);
  }
}

function safeCallback(callback, ...args) {
  if (typeof callback !== "function") return;
  try {
    callback(...args);
  } catch (error) {
    console.error("Bent Walad relay callback failed", error);
  }
}

export function joinRoom(config, roomName, options = {}) {
  const roomCode = extractRoomCode(roomName);
  if (!roomCode) throw new Error("Room name must end with a six-digit code");

  const relayUrl = normalizeRelayUrl(config?.relayUrl);
  const role = config?.role === "host" ? "host" : "guest";
  const fetchImpl = config?.fetch || globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) throw new Error("Fetch is unavailable");

  const pollMs = Math.max(250, Number(config?.pollInterval) || DEFAULT_POLL_MS);
  const hiddenPollMs = Math.max(
    pollMs,
    Number(config?.hiddenPollInterval) || DEFAULT_HIDDEN_POLL_MS
  );
  const timeoutMs = Math.max(
    0,
    Number(config?.requestTimeout) || DEFAULT_TIMEOUT_MS
  );
  const token = randomHex();
  const actionHandlers = new Map();
  let knownPeers = new Set();
  let cursor = 0;
  let pollTimer = 0;
  let pollPromise = null;
  let joined = false;
  let closed = false;
  let connectionState = "connecting";

  const room = {
    onPeerJoin: null,
    onPeerLeave: null,
    ready: null,
    makeAction,
    leave,
    pollNow
  };

  function setConnectionState(nextState, error) {
    if (connectionState === nextState && !error) return;
    connectionState = nextState;
    safeCallback(options.onStatusChange, nextState, error);
  }

  function updatePeers(peerRows) {
    const nextPeers = new Set(
      (Array.isArray(peerRows) ? peerRows : [])
        .map(peer => String(peer?.peerId ?? ""))
        .filter(peerId => peerId && peerId !== selfId)
    );

    knownPeers.forEach(peerId => {
      if (!nextPeers.has(peerId)) safeCallback(room.onPeerLeave, peerId);
    });
    nextPeers.forEach(peerId => {
      if (!knownPeers.has(peerId)) safeCallback(room.onPeerJoin, peerId);
    });
    knownPeers = nextPeers;
  }

  function dispatchEvents(events) {
    (Array.isArray(events) ? events : []).forEach(event => {
      const action = actionHandlers.get(String(event?.action ?? ""));
      if (!action || typeof action.onMessage !== "function") return;
      const peerId = String(event?.peerId ?? "");
      if (!peerId || peerId === selfId) return;
      safeCallback(action.onMessage, event.data, { peerId });
    });
  }

  function request(operation, body) {
    return requestJson({
      fetchImpl,
      relayUrl,
      roomCode,
      operation,
      body,
      timeoutMs
    });
  }

  async function connect() {
    const response = await request("join", {
      peerId: selfId,
      token,
      role
    });
    if (closed) return response;
    joined = true;
    cursor = Math.max(0, Number(response.cursor) || 0);
    updatePeers(response.peers);
    setConnectionState("connected");
    schedulePoll(0);
    return response;
  }

  function schedulePoll(delay) {
    if (closed || !joined) return;
    globalThis.clearTimeout(pollTimer);
    const hidden = typeof document !== "undefined" && document.hidden;
    pollTimer = globalThis.setTimeout(
      () => void pollNow(),
      delay ?? (hidden ? hiddenPollMs : pollMs)
    );
  }

  async function pollNow() {
    if (closed || !joined) return null;
    if (pollPromise) return pollPromise;
    globalThis.clearTimeout(pollTimer);

    pollPromise = (async () => {
      try {
        const response = await request("poll", {
          peerId: selfId,
          token,
          cursor
        });
        if (closed) return response;
        updatePeers(response.peers);
        dispatchEvents(response.events);
        cursor = Math.max(cursor, Number(response.cursor) || 0);
        setConnectionState("connected");
        return response;
      } catch (error) {
        if (error?.status === 401 || error?.status === 404) {
          updatePeers([]);
          joined = false;
          setConnectionState("error", error);
          safeCallback(options.onRoomError, error);
          return null;
        }
        setConnectionState("reconnecting", error);
        safeCallback(options.onPollError, error);
        return null;
      } finally {
        pollPromise = null;
        if (!closed && joined) schedulePoll();
      }
    })();
    return pollPromise;
  }

  async function sendAction(actionName, data, sendOptions = {}) {
    if (closed) throw new RelayRequestError("Room is closed");
    await room.ready;
    const body = {
      peerId: selfId,
      token,
      action: actionName,
      clientEventId: randomHex(),
      data,
      target: sendOptions?.target || null
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await request("action", body);
      } catch (error) {
        const retryable = !error?.status || error.status >= 500;
        if (!retryable || attempt === 1) throw error;
        await new Promise(resolve => globalThis.setTimeout(resolve, 250));
      }
    }
    return null;
  }

  function makeAction(actionName) {
    const name = String(actionName ?? "");
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(name)) {
      throw new Error("Invalid room action name");
    }
    const action = {
      onMessage: null,
      send(data, sendOptions) {
        return sendAction(name, data, sendOptions);
      }
    };
    actionHandlers.set(name, action);
    return action;
  }

  function leave() {
    if (closed) return;
    closed = true;
    globalThis.clearTimeout(pollTimer);
    globalThis.removeEventListener?.("online", pollNow);
    if (!joined) return;
    joined = false;
    const body = JSON.stringify({ peerId: selfId, token });
    void fetchImpl(`${relayUrl}/api/rooms/${roomCode}/leave`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      keepalive: true
    }).catch(() => {});
  }

  globalThis.addEventListener?.("online", pollNow);
  room.ready = Promise.resolve().then(connect);
  void room.ready.catch(error => {
    if (closed) return;
    setConnectionState("error", error);
    safeCallback(options.onJoinError, { error });
  });
  return room;
}
