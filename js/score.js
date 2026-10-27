// Sound and music, all synthesized. Everything is scheduled ahead on the audio clock from wherever playback starts;
// pausing or jumping throws the whole schedule away (the bus it plays through is cut) and builds it again.
import { SHOTS, T, LEN } from './cast.js';

let ac = null, noiseBuf = null, bus = null, master = null, muted = false;
export const isMuted = () => muted;
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.9; }
function ctx() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const n = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, n, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp).connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(at, f, d, type = 'sine', v = 0.2, f2, attack = 0.006) {
  if (at + d < ac.currentTime) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), at + d);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(g).connect(bus); o.start(at); o.stop(at + d + 0.05);
}
function noise(at, d, v = 0.3, freq = 1200, q = 0.8, type = 'lowpass', f2) {
  if (at + d < ac.currentTime) return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, at); if (f2) f.frequency.exponentialRampToValueAtTime(f2, at + d); f.Q.value = q;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
  s.connect(f).connect(g).connect(bus); s.start(at, Math.random()); s.stop(at + d + 0.05);
}
// a held note that swells in and dies away
function pad(at, f, d, v, type = 'sawtooth', cut = 600) {
  if (at + d < ac.currentTime) return;
  const o = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
  o.type = o2.type = type; o.frequency.value = f; o2.frequency.value = f * 1.006; fl.type = 'lowpass'; fl.frequency.value = cut;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + Math.min(1.5, d * 0.3)); g.gain.setValueAtTime(v, at + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(fl); o2.connect(fl); fl.connect(g).connect(bus); o.start(at); o2.start(at); o.stop(at + d + 0.05); o2.stop(at + d + 0.05);
}

const SND = {
  step: (a, k = 1) => { tone(a, 85, 0.16, 'sine', 0.3 * k, 40); noise(a, 0.1, 0.12 * k, 380); tone(a + 0.02, 1200, 0.04, 'square', 0.015 * k, 900); },
  heavy: (a) => { tone(a, 70, 0.7, 'sine', 0.6, 28); noise(a, 0.6, 0.45, 420); noise(a, 0.15, 0.2, 2400, 0.7, 'highpass'); },
  servo: (a) => { tone(a, 260, 0.3, 'square', 0.03, 520); tone(a + 0.25, 900, 0.05, 'square', 0.03); },
  shot: (a) => { noise(a, 0.06, 0.32, 2600, 0.7, 'highpass'); tone(a, 140, 0.07, 'square', 0.1, 60); tone(a, 70, 0.1, 'sine', 0.25, 40); },
  ric: (a) => { noise(a, 0.08, 0.1, 3200, 2, 'bandpass'); tone(a, 2400, 0.12, 'triangle', 0.03, 1300); },
  tink: (a) => { tone(a, 1900, 0.18, 'triangle', 0.09, 1500); noise(a, 0.05, 0.25, 3000); },
  launch: (a) => { noise(a, 0.7, 0.3, 700, 1.2, 'bandpass', 1800); tone(a, 180, 0.5, 'sawtooth', 0.05, 500); noise(a + 0.1, 1.4, 0.1, 1200, 1, 'bandpass', 600); },
  boom: (a, k = 1) => { noise(a, 1.6 * k, 0.75 * k, 520, 0.7, 'lowpass', 120); tone(a, 75, 1.0 * k, 'sine', 0.6 * k, 26); noise(a, 0.18, 0.35 * k, 2500, 0.6, 'highpass'); },
  clang: (a, k = 1) => { tone(a, 680, 0.7, 'triangle', 0.22 * k, 520); tone(a, 1130, 0.45, 'square', 0.05 * k, 900); tone(a, 1720, 1.1, 'sine', 0.07 * k); noise(a, 0.12, 0.45 * k, 3200); tone(a, 110, 0.3, 'sine', 0.35 * k, 50); },
  zap: (a, d = 0.4, k = 1) => { for (let i = 0; i < d * 25; i++) tone(a + i * 0.04, 200 + Math.random() * 1200, 0.05, 'sawtooth', 0.05 * k); noise(a, d, 0.15 * k, 4500, 1, 'highpass'); },
  hum: (a, d) => { tone(a, 120, d, 'sawtooth', 0.025, 118, 0.2); tone(a, 240, d, 'square', 0.008, 241, 0.2); },
  whoosh: (a, d = 0.35, k = 1) => noise(a, d, 0.25 * k, 400, 2, 'bandpass', 1600),
  jet: (a, d = 0.8, k = 1) => { noise(a, d, 0.22 * k, 900, 0.8, 'bandpass', 500); noise(a, d, 0.08 * k, 5000, 1, 'highpass'); },
  hit: (a) => { noise(a, 0.12, 0.5, 1400); tone(a, 220, 0.12, 'square', 0.1, 90); tone(a, 900, 0.3, 'triangle', 0.06, 600); },
  crunch: (a) => { noise(a, 0.4, 0.5, 900, 0.6, 'lowpass', 200); for (let i = 0; i < 6; i++) tone(a + i * 0.03, 300 + Math.random() * 600, 0.06, 'square', 0.04); },
};

// what is heard when: [time, sound, ...args]
const CUES = (() => {
  const c = [];
  for (let k = 0; k * 0.48 + 0.24 < T.stop + 0.4; k++) { const at = k * 0.48 + 0.24; c.push([at, 'step', at > 3.5 && at < 6 ? 1.3 : 0.6]); }
  c.push([6.25, 'jet', 0.9, 1], [T.land, 'heavy'], [7.6, 'step', 0.7], [T.raise, 'servo']);
  for (const s of SHOTS) { c.push([s.t, 'shot']); c.push([s.t + 0.2, s.hit ? 'tink' : 'ric']); }
  c.push([9.45, 'jet', 0.8, 0.8], [T.missile1, 'launch'], [T.missile2, 'launch']);
  c.push([T.leap - 0.05, 'jet', 0.55, 0.9], [T.boom1, 'boom', 1.1], [T.boom2, 'boom', 0.9], [T.leapLand, 'heavy']);
  c.push([13.85, 'zap', 0.25, 0.6], [13.9, 'hum', 12.5], [13.85, 'jet', 1.5, 1.2], [15.15, 'whoosh', 0.3, 1.2]);
  c.push([T.clash, 'clang', 1.4], [T.clash, 'zap', 1.0, 1.2], [T.part, 'whoosh', 0.4], [T.part + 0.05, 'clang', 0.6]);
  for (const [i, te] of T.slash.entries()) { c.push([te - 0.15, 'whoosh', 0.25]); c.push(i < 2 ? [te, 'clang', 0.9] : [te, 'hit']); if (i < 2) c.push([te, 'zap', 0.2, 0.6]); }
  c.push([T.over - 0.2, 'whoosh', 0.3, 1.2], [T.over + 0.03, 'heavy'], [T.counter - 0.1, 'whoosh', 0.25], [T.counter, 'zap', 0.6, 1.4], [T.counter, 'hit'], [T.armOff, 'crunch'], [T.armOff + 0.02, 'boom', 0.5]);
  c.push([22.1, 'step', 0.8], [22.5, 'step', 0.8], [T.jump - 0.05, 'jet', 0.8, 1.3], [24.3, 'whoosh', 0.35, 1.3]);
  c.push([T.strike, 'clang', 1.5], [T.strike, 'zap', 0.9, 1.6], [T.strike + 0.03, 'boom', 0.7], [T.ronLand, 'heavy']);
  c.push([T.boomA, 'boom', 0.8], [T.boomB, 'boom', 1.5], [T.fall + 0.75, 'heavy'], [27.3, 'crunch']);
  return c;
})();

// the score: a low drone; drums from the moment the Hound lands; a driving bass through the fight; silence in the
// air over the last blow; a chord when it lands
const N = { A1: 55, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98, A2: 110, C3: 130.8, E3: 164.8, A3: 220, C4: 261.6, E4: 329.6, A4: 440 };
function music(at0, from) {
  const at = (t) => at0 + (t - from);
  const drum = (t, k = 1) => { if (t < from) return; tone(at(t), 62, 0.45, 'sine', 0.35 * k, 38); noise(at(t), 0.12, 0.12 * k, 700); };
  const snare = (t, k = 1) => { if (t < from) return; noise(at(t), 0.16, 0.13 * k, 1800, 0.8, 'bandpass'); tone(at(t), 190, 0.08, 'triangle', 0.05 * k, 120); };
  const bass = (t, f, d = 0.22) => { if (t < from) return; tone(at(t), f, d, 'sawtooth', 0.07, f * 0.99, 0.01); };
  // the drone, split in pieces so a late start still hears it
  for (const [t0, t1, f, v] of [[0, 8, N.A1, 0.05], [0, 8, N.E2, 0.03], [8, 16, N.A1, 0.05], [8, 16, N.E2, 0.03], [16, 24, N.F2 / 2, 0.05], [16, 24, N.C2, 0.03]]) {
    if (t1 < from) continue; const s = Math.max(t0, from); pad(at(s), f, t1 - s + 0.4, v, 'sawtooth', 320);
  }
  drum(T.land, 1.4);
  // half-time drums through the standoff, then the full beat once the guns open up (100 bpm, eighths of 0.3 s)
  for (let t = 9.2; t < 24.0; t += 0.3) {
    const k = Math.round((t - 9.2) / 0.3), bar = k % 8;
    if (t < 12) { if (bar === 0 || bar === 3) drum(t, 0.9); if (bar === 4) snare(t, 0.7); continue; }
    if (bar === 0 || bar === 3 || bar === 6) drum(t, 1); if (bar === 2 || bar === 6) snare(t, 1);
    const line = t < 18 ? [N.A1, N.A1, N.C2, N.A1, N.E2, N.A1, N.D2, N.C2] : [N.F2 / 2, N.F2 / 2, N.A1, N.F2 / 2, N.C2, N.F2 / 2, N.E2, N.D2];
    bass(t, line[bar]);
  }
  // the hit, and the long chord after it
  if (T.strike + 4 > from) { drum(T.strike, 1.8); for (const f of [N.A2, N.E3, N.A3, N.C4]) pad(at(Math.max(from, T.strike)), f, 5.5, 0.035, 'sawtooth', 1400); }
  if (LEN > from) for (const f of [N.A3, N.E4, N.A4]) pad(at(Math.max(from, 27)), f, 3.4, 0.03, 'triangle', 2400);
}

// start everything from time `from`
export function play(from) {
  ctx(); stop();
  bus = ac.createGain(); bus.connect(master);
  const at0 = ac.currentTime + 0.05;
  for (const [t, name, ...args] of CUES) if (t >= from - 0.02) SND[name](at0 + (t - from), ...args);
  // a hum started earlier is still going: pick it up
  if (from > 13.9 && from < 26.4) SND.hum(at0, 26.4 - from);
  music(at0, from);
}
export function stop() { if (bus) { const b = bus; b.gain.setValueAtTime(b.gain.value, ac.currentTime); b.gain.linearRampToValueAtTime(0, ac.currentTime + 0.05); setTimeout(() => b.disconnect(), 120); bus = null; } }
export const audioTime = () => (ac ? ac.currentTime : 0);
