// The soundtrack: one finished mix of real recordings and an orchestral score (built by tools/mix.py, timed to the
// film from tools/cues.json), played from wherever the film is. Playing, pausing and jumping restart it at that point.
let token = 0, ac = null, buf = null, src = null, gain = null, muted = false, loading = null, startedAt = 0, from = 0;
export const isMuted = () => muted;
export function setMuted(m) { muted = m; if (gain) gain.gain.value = m ? 0 : 1; }
function ctx() {
  if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); gain = ac.createGain(); gain.gain.value = muted ? 0 : 1; gain.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
export function load() {
  if (!loading) loading = fetch('audio/soundtrack.mp3?v=1').then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => ctx().decodeAudioData(a, ok, no))).then((b) => { buf = b; return b; }).catch(() => null);
  return loading;
}
export async function play(t) {
  ctx(); stop();
  const mine = token, want = performance.now();
  await load(); if (!buf || mine !== token) return;
  const late = (performance.now() - want) / 1000; // time spent waiting for the file
  from = t + late; if (from >= buf.duration) return;
  src = ac.createBufferSource(); src.buffer = buf; src.connect(gain); src.start(0, from); startedAt = ac.currentTime;
}
export function stop() { token++; if (src) { try { src.stop(); } catch (e) { /* already stopped */ } src.disconnect(); src = null; } }
