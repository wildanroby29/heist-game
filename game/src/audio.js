// All sound in The Vault is synthesized with WebAudio — no audio files.
// The context is created lazily on the first user gesture so browsers allow it.
let ctx = null;
let muted = false;
let alarmNodes = null;

function audio() {
  if (ctx === null) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ac = audio();
  if (ac === null || muted) return;
  const start = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function unlockAudio() {
  audio();
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarmSiren();
  return muted;
}

export function isMuted() {
  return muted;
}

/** Two-note chime when a gold bar is pocketed. */
export function soundPickup() {
  tone(880, 0.12, 'sine', 0.22);
  tone(1318, 0.18, 'sine', 0.2, 0.09);
}

/** Small metallic ping when a thrown coin lands. */
export function soundCoin() {
  tone(2093, 0.09, 'triangle', 0.2);
  tone(1568, 0.14, 'triangle', 0.14, 0.06);
}

/** Soft footstep tick, only while walking (not sneaking). */
export function soundStep() {
  tone(140, 0.05, 'sine', 0.05);
}

/** Harsh buzz when the thief is grabbed. */
export function soundCaught() {
  tone(220, 0.25, 'sawtooth', 0.25);
  tone(147, 0.4, 'sawtooth', 0.25, 0.18);
}

/** Rising arpeggio for a clean getaway. */
export function soundWin() {
  [523, 659, 784, 1047].forEach((freq, index) => tone(freq, 0.22, 'triangle', 0.22, index * 0.12));
}

/** A short warning blip when a cone first spots the thief. */
export function soundSpotted() {
  tone(988, 0.1, 'square', 0.12);
}

/** Looping two-tone siren while the alarm is tripped; call stopAlarmSiren to end it. */
export function startAlarmSiren() {
  const ac = audio();
  if (ac === null || muted || alarmNodes !== null) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = 620;
  lfo.type = 'sine';
  lfo.frequency.value = 1.6;
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.value = 0.045;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  lfo.start();
  alarmNodes = { osc, lfo, gain };
}

export function stopAlarmSiren() {
  if (alarmNodes === null) return;
  try {
    alarmNodes.osc.stop();
    alarmNodes.lfo.stop();
  } catch (error) {
    // Already stopped; nothing to do.
  }
  alarmNodes = null;
}
