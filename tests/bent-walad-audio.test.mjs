import test from "node:test";
import assert from "node:assert/strict";

class FakeParam {
  constructor(value = 0) {
    this.value = value;
  }

  cancelScheduledValues() {}
  exponentialRampToValueAtTime(value) {
    this.value = value;
  }
  setTargetAtTime(value) {
    this.value = value;
  }
  setValueAtTime(value) {
    this.value = value;
  }
}

class FakeNode {
  constructor() {
    this.detune = new FakeParam();
    this.frequency = new FakeParam();
    this.gain = new FakeParam();
    this.Q = new FakeParam();
  }

  connect() {
    return this;
  }
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = new FakeNode();
    this.sampleRate = 8000;
    this.state = "suspended";
    this.createdNodes = 0;
    FakeAudioContext.latest = this;
  }

  createBiquadFilter() {
    this.createdNodes += 1;
    return new FakeNode();
  }
  createBuffer(_channels, length) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    this.createdNodes += 1;
    return new FakeNode();
  }
  createGain() {
    this.createdNodes += 1;
    return new FakeNode();
  }
  createOscillator() {
    this.createdNodes += 1;
    return new FakeNode();
  }
  async close() {
    this.state = "closed";
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
}

const preferences = new Map();
globalThis.AudioContext = FakeAudioContext;
globalThis.localStorage = {
  getItem: key => preferences.get(key) ?? null,
  setItem: (key, value) => preferences.set(key, value)
};
globalThis.window = {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout
};

const { createGameAudio } = await import("../bent-walad-audio.mjs?audio-test");

test("audio engine unlocks, plays every effect, mutes, and resumes safely", async () => {
  const states = [];
  const audio = createGameAudio({
    storageKey: "audio-test",
    onStateChange: state => states.push(state)
  });

  assert.deepEqual(audio.getState(), {
    enabled: true,
    running: false,
    supported: true
  });
  assert.equal(await audio.unlock(), true);
  assert.equal(audio.getState().running, true);

  [
    "type",
    "select",
    "click",
    "stop",
    "success",
    "word-win",
    "word-lose"
  ].forEach(effect => {
    audio.play(effect);
  });
  assert.ok(FakeAudioContext.latest.createdNodes > 20);

  assert.equal(await audio.setEnabled(false), false);
  assert.equal(preferences.get("audio-test"), "off");
  assert.equal(audio.getState().running, false);

  assert.equal(await audio.setEnabled(true), true);
  assert.equal(preferences.get("audio-test"), "on");
  await audio.setPageVisible(false);
  assert.equal(FakeAudioContext.latest.state, "suspended");
  await audio.setPageVisible(true);
  assert.equal(FakeAudioContext.latest.state, "running");
  assert.ok(states.some(state => state.running));

  audio.dispose();
});
