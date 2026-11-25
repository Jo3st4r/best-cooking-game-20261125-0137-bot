// Sizzle & Serve — tiny WebAudio synth: every sound is generated, no audio
// files are shipped. The context is created on the first user gesture so the
// browser's autoplay rules are respected.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A soft pop when an ingredient lands on the plate.
export function playPop() {
  tone(520, 0.09, 'triangle', 0.18);
  tone(780, 0.07, 'triangle', 0.1, 0.02);
}

// A rising ding when a patty finishes cooking.
export function playDing() {
  tone(880, 0.16, 'sine', 0.2);
  tone(1318, 0.22, 'sine', 0.14, 0.08);
}

// A happy two-note chime when an order is served.
export function playServe(combo) {
  const base = 660 + combo * 60;
  tone(base, 0.12, 'triangle', 0.2);
  tone(base * 1.5, 0.2, 'triangle', 0.18, 0.09);
}

// A low buzz when a serve is wrong or an order walks out.
export function playBuzz() {
  tone(160, 0.28, 'sawtooth', 0.14);
  tone(110, 0.3, 'sawtooth', 0.12, 0.05);
}

// A short sizzle burst when a raw patty hits the grill.
export function playSizzle() {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const dur = 0.5;
  const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.25;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const gain = ac.createGain();
  gain.gain.value = 0.5;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}
