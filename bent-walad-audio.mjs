const AudioContextClass =
  globalThis.AudioContext || globalThis.webkitAudioContext;

// A short original melody built on a D Hijaz colour: D, Eb, F#, G, A, Bb, C.
// It is synthesized in the browser and does not use or copy a recorded song.
export const HIJAZ_SCALE = Object.freeze([
  293.66,
  311.13,
  369.99,
  392,
  440,
  466.16,
  523.25,
  587.33
]);

export const HIJAZ_MELODY = Object.freeze([
  0, 1, 2, 3, 2, 1, 0, null,
  0, 3, 4, 3, 2, 1, 0, null,
  4, 5, 6, 7, 6, 5, 4, 3,
  2, 3, 2, 1, 0, null, 1, 0
]);

const MUSIC_STEP_SECONDS = 60 / 92 / 2;
const LOOK_AHEAD_SECONDS = 0.55;
const SCHEDULER_INTERVAL_MS = 110;
export const AUDIO_LEVELS = Object.freeze({
  master: 1,
  music: 0.38,
  effects: 0.94
});

function readPreference(storageKey) {
  try {
    return localStorage.getItem(storageKey) !== "off";
  } catch {
    return true;
  }
}

function savePreference(storageKey, enabled) {
  try {
    localStorage.setItem(storageKey, enabled ? "on" : "off");
  } catch {}
}

export function createGameAudio({
  storageKey = "bent-walad-sound",
  onStateChange = () => {}
} = {}) {
  let context = null;
  let masterGain = null;
  let musicGain = null;
  let effectsGain = null;
  let noiseBuffer = null;
  let schedulerId = 0;
  let nextMusicAt = 0;
  let musicStep = 0;
  let lastTypeAt = 0;
  let unlockPromise = null;
  let unlockedOnce = false;
  let enabled = readPreference(storageKey);

  function getState() {
    return {
      enabled,
      running: Boolean(enabled && context?.state === "running"),
      supported: Boolean(AudioContextClass)
    };
  }

  function notify() {
    onStateChange(getState());
  }

  function buildGraph() {
    if (context || !AudioContextClass) return Boolean(context);

    context = new AudioContextClass();
    masterGain = context.createGain();
    musicGain = context.createGain();
    effectsGain = context.createGain();

    masterGain.gain.value = enabled ? AUDIO_LEVELS.master : 0.0001;
    musicGain.gain.value = AUDIO_LEVELS.music;
    effectsGain.gain.value = AUDIO_LEVELS.effects;
    musicGain.connect(masterGain);
    effectsGain.connect(masterGain);
    masterGain.connect(context.destination);

    noiseBuffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * 0.18),
      context.sampleRate
    );
    const noise = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noise.length; index += 1) {
      const fade = 1 - index / noise.length;
      noise[index] = (Math.random() * 2 - 1) * fade;
    }
    return true;
  }

  function pluck(frequency, when, duration = 0.28, volume = 0.065) {
    if (!context || !musicGain) return;
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const body = context.createOscillator();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, when);
    filter.frequency.exponentialRampToValueAtTime(780, when + duration);
    filter.Q.value = 1.7;

    body.type = "triangle";
    body.frequency.setValueAtTime(frequency, when);
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(frequency * 2, when);
    shimmer.detune.value = -6;
    shimmerGain.gain.value = 0.22;

    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    body.connect(filter);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(filter);
    filter.connect(envelope);
    envelope.connect(musicGain);
    body.start(when);
    shimmer.start(when);
    body.stop(when + duration + 0.04);
    shimmer.stop(when + duration + 0.04);
  }

  function frameDrum(when, accented = false) {
    if (!context || !musicGain || !noiseBuffer) return;
    const drum = context.createOscillator();
    const drumEnvelope = context.createGain();
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseEnvelope = context.createGain();
    const length = accented ? 0.19 : 0.09;

    drum.type = "sine";
    drum.frequency.setValueAtTime(accented ? 118 : 168, when);
    drum.frequency.exponentialRampToValueAtTime(
      accented ? 54 : 105,
      when + length
    );
    drumEnvelope.gain.setValueAtTime(accented ? 0.1 : 0.045, when);
    drumEnvelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    drum.connect(drumEnvelope);
    drumEnvelope.connect(musicGain);

    noise.buffer = noiseBuffer;
    noiseFilter.type = accented ? "lowpass" : "bandpass";
    noiseFilter.frequency.value = accented ? 520 : 1850;
    noiseFilter.Q.value = accented ? 0.7 : 2.4;
    noiseEnvelope.gain.setValueAtTime(accented ? 0.035 : 0.025, when);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnvelope);
    noiseEnvelope.connect(musicGain);

    drum.start(when);
    noise.start(when);
    drum.stop(when + length + 0.03);
    noise.stop(when + length + 0.03);
  }

  function scheduleMusic() {
    if (!enabled || context?.state !== "running") return;
    while (nextMusicAt < context.currentTime + LOOK_AHEAD_SECONDS) {
      const stepInPhrase = musicStep % HIJAZ_MELODY.length;
      const degree = HIJAZ_MELODY[stepInPhrase];

      if (degree != null) {
        const strongBeat = musicStep % 8 === 0;
        pluck(
          HIJAZ_SCALE[degree],
          nextMusicAt,
          strongBeat ? 0.42 : 0.28,
          strongBeat ? 0.075 : 0.052
        );
      }
      if (musicStep % 4 === 0) frameDrum(nextMusicAt, musicStep % 8 === 0);
      if (musicStep % 8 === 6) frameDrum(nextMusicAt, false);
      if (musicStep % 16 === 0) {
        pluck(HIJAZ_SCALE[0] / 2, nextMusicAt, 0.72, 0.04);
      }

      musicStep += 1;
      nextMusicAt += MUSIC_STEP_SECONDS;
    }
  }

  function startScheduler() {
    if (schedulerId || !enabled || context?.state !== "running") return;
    nextMusicAt = context.currentTime + 0.08;
    musicStep = 0;
    scheduleMusic();
    schedulerId = window.setInterval(scheduleMusic, SCHEDULER_INTERVAL_MS);
  }

  function stopScheduler() {
    if (schedulerId) window.clearInterval(schedulerId);
    schedulerId = 0;
  }

  function effectTone({
    frequency,
    endFrequency = frequency,
    duration,
    volume,
    type = "sine",
    delay = 0
  }) {
    if (!context || !effectsGain || context.state !== "running") return;
    const when = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      when + duration
    );
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(effectsGain);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
  }

  function emitEffect(kind) {
    if (!enabled || context?.state !== "running") return;

    if (kind === "type") {
      const now = performance.now();
      if (now - lastTypeAt < 34) return;
      lastTypeAt = now;
      const pitches = [698.46, 783.99, 880, 932.33];
      const pitch = pitches[Math.floor(Math.random() * pitches.length)];
      effectTone({
        frequency: pitch,
        endFrequency: pitch * 0.92,
        duration: 0.045,
        volume: 0.035,
        type: "triangle"
      });
      return;
    }

    if (kind === "select") {
      effectTone({
        frequency: 520,
        endFrequency: 690,
        duration: 0.075,
        volume: 0.045,
        type: "triangle"
      });
      return;
    }

    if (kind === "stop") {
      effectTone({
        frequency: 150,
        endFrequency: 52,
        duration: 0.25,
        volume: 0.15,
        type: "sine"
      });
      effectTone({
        frequency: 390,
        endFrequency: 245,
        duration: 0.12,
        volume: 0.055,
        type: "square",
        delay: 0.02
      });
      return;
    }

    if (kind === "success") {
      [0, 2, 4, 7].forEach((degree, index) => {
        effectTone({
          frequency: HIJAZ_SCALE[degree],
          endFrequency: HIJAZ_SCALE[degree],
          duration: 0.16,
          volume: 0.055,
          type: "triangle",
          delay: index * 0.085
        });
      });
      return;
    }

    if (kind === "word-win") {
      [3, 4, 7].forEach((degree, index) => {
        effectTone({
          frequency: HIJAZ_SCALE[degree],
          endFrequency: HIJAZ_SCALE[degree] * 1.04,
          duration: 0.18,
          volume: 0.095,
          type: "triangle",
          delay: index * 0.075
        });
      });
      return;
    }

    if (kind === "word-lose") {
      effectTone({
        frequency: 310,
        endFrequency: 82,
        duration: 0.32,
        volume: 0.13,
        type: "sawtooth"
      });
      effectTone({
        frequency: 145,
        endFrequency: 48,
        duration: 0.28,
        volume: 0.15,
        type: "sine",
        delay: 0.045
      });
      return;
    }

    effectTone({
      frequency: 420,
      endFrequency: 610,
      duration: 0.085,
      volume: 0.052,
      type: "triangle"
    });
    effectTone({
      frequency: 660,
      endFrequency: 720,
      duration: 0.065,
      volume: 0.035,
      type: "sine",
      delay: 0.035
    });
  }

  async function unlock() {
    if (!enabled || !AudioContextClass) {
      notify();
      return false;
    }
    if (unlockPromise) return unlockPromise;

    unlockPromise = (async () => {
      if (!buildGraph()) return false;
      if (context.state !== "running") {
        let resumeTimeout = 0;
        try {
          await Promise.race([
            context.resume(),
            new Promise(resolve => {
              resumeTimeout = window.setTimeout(resolve, 300);
            })
          ]);
        } catch {}
        window.clearTimeout(resumeTimeout);
      }
      const running = context.state === "running";
      if (running) {
        masterGain.gain.cancelScheduledValues(context.currentTime);
        masterGain.gain.setTargetAtTime(
          AUDIO_LEVELS.master,
          context.currentTime,
          0.025
        );
        startScheduler();
        if (!unlockedOnce) {
          unlockedOnce = true;
          emitEffect("success");
        }
      }
      notify();
      return running;
    })();

    try {
      return await unlockPromise;
    } finally {
      unlockPromise = null;
    }
  }

  async function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    savePreference(storageKey, enabled);

    if (!enabled) {
      stopScheduler();
      if (context && masterGain) {
        masterGain.gain.cancelScheduledValues(context.currentTime);
        masterGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
      }
      notify();
      return false;
    }

    return unlock();
  }

  function play(kind = "click") {
    if (!enabled || !AudioContextClass) return;
    if (context?.state === "running") {
      emitEffect(kind);
      return;
    }
    unlock().then(running => {
      if (running) emitEffect(kind);
    });
  }

  async function tryAutoplay() {
    if (!enabled || !AudioContextClass) {
      notify();
      return false;
    }
    return unlock();
  }

  async function setPageVisible(visible) {
    if (!context) return;
    if (!visible) {
      stopScheduler();
      try {
        await context.suspend();
      } catch {}
      notify();
      return;
    }
    if (enabled && unlockedOnce) await unlock();
  }

  function dispose() {
    stopScheduler();
    if (context && context.state !== "closed") context.close().catch(() => {});
  }

  return {
    dispose,
    getState,
    play,
    setEnabled,
    setPageVisible,
    tryAutoplay,
    unlock
  };
}
