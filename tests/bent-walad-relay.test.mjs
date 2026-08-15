import test from "node:test";
import assert from "node:assert/strict";

import {
  extractRoomCode,
  joinRoom,
  normalizeRelayUrl,
  selfId
} from "../bent-walad-relay.mjs";

test("relay room helpers validate codes and URLs", () => {
  assert.equal(extractRoomCode("bw2-123456"), "123456");
  assert.equal(extractRoomCode("bw2-12345"), "");
  assert.equal(normalizeRelayUrl("https://relay.example/"), "https://relay.example");
  assert.throws(() => normalizeRelayUrl("ftp://relay.example"));
});

test("relay adapter joins peers and sends targeted actions", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    const operation = String(url).split("/").at(-1);
    const body = JSON.parse(options.body);
    requests.push({ operation, body });

    if (operation === "join") {
      return Response.json({
        ok: true,
        hostId: "host-1234",
        peers: [
          { peerId: "host-1234", role: "host" },
          { peerId: selfId, role: "guest" }
        ],
        cursor: 0
      });
    }
    return Response.json({ ok: true });
  };

  const joinedPeers = [];
  const room = joinRoom(
    {
      relayUrl: "https://relay.example",
      role: "guest",
      fetch: fetchImpl,
      pollInterval: 10_000,
      requestTimeout: 1_000
    },
    "bw2-123456"
  );
  room.onPeerJoin = peerId => joinedPeers.push(peerId);
  const state = room.makeAction("state");
  await room.ready;
  await state.send({ round: 2 }, { target: "host-1234" });
  room.leave();

  assert.deepEqual(joinedPeers, ["host-1234"]);
  assert.equal(requests[0].operation, "join");
  assert.equal(requests[0].body.role, "guest");
  assert.equal(requests[1].operation, "action");
  assert.equal(requests[1].body.action, "state");
  assert.equal(requests[1].body.target, "host-1234");
  assert.deepEqual(requests[1].body.data, { round: 2 });
});

test("relay adapter dispatches polled events and peer departures", async () => {
  let pollCount = 0;
  const fetchImpl = async (url, options) => {
    const operation = String(url).split("/").at(-1);
    if (operation === "join") {
      return Response.json({
        ok: true,
        hostId: "host-1234",
        peers: [
          { peerId: "host-1234", role: "host" },
          { peerId: selfId, role: "guest" }
        ],
        cursor: 4
      });
    }
    if (operation === "poll") {
      pollCount += 1;
      return Response.json({
        ok: true,
        hostId: "host-1234",
        peers: [{ peerId: selfId, role: "guest" }],
        events: [
          {
            id: 5,
            peerId: "host-1234",
            action: "state",
            data: { currentRound: 2 }
          }
        ],
        cursor: 5
      });
    }
    return Response.json({ ok: true });
  };

  const leftPeers = [];
  const received = [];
  const room = joinRoom(
    {
      relayUrl: "https://relay.example",
      role: "guest",
      fetch: fetchImpl,
      pollInterval: 10_000,
      requestTimeout: 1_000
    },
    "bw2-123456"
  );
  room.onPeerLeave = peerId => leftPeers.push(peerId);
  const state = room.makeAction("state");
  state.onMessage = (data, meta) => received.push({ data, meta });
  await room.ready;
  await room.pollNow();
  room.leave();

  assert.equal(pollCount, 1);
  assert.deepEqual(leftPeers, ["host-1234"]);
  assert.deepEqual(received, [
    { data: { currentRound: 2 }, meta: { peerId: "host-1234" } }
  ]);
});
