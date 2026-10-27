// node tools/cues.mjs [ep1] > tools/cues.json — everything the sound mix (tools/mix.py) needs from an episode:
// its cues (gunshots, blasts, clashes, swings...), every footstep and landing, when the thrusters burn,
// where the helicopters are, and the music cue sheet
import { createRuntime } from '../js/core/runtime.js?v=3';
import { CHARACTERS } from '../js/cast/characters.js?v=3';
const ep = process.argv[2] || 'ep1';
const story = (await import(`../js/story/${ep}.js?v=3`)).default;
const rt = createRuntime(story);
const r2 = (v) => Math.round(v * 1000) / 1000;
const steps = [], jets = [], helis = [], rods = [];
for (const A of rt.actors) {
  const C = CHARACTERS[A.who];
  if (C?.kind === 'wanzer') {
    for (const s of rt.feet(A.id).steps) steps.push({ t: r2(s.t), k: r2(s.k), land: !!s.land, who: A.id });
    // thrusters: each stretch of time they burn, and how hard
    let on = null;
    for (let t = 0; t <= story.LEN; t += 1 / 30) {
      const k = rt.state(A.id, t).jets;
      if (k > 0.15 && !on) on = { who: A.id, t0: r2(t), k: 0 };
      if (on) on.k = Math.max(on.k, r2(k));
      if (on && k <= 0.15) { on.t1 = r2(t); jets.push(on); on = null; }
    }
    if (on) { on.t1 = story.LEN; jets.push(on); }
    // a live shock rod hums
    let r0 = null;
    for (let t = 0; t <= story.LEN; t += 1 / 10) { const k = rt.state(A.id, t).rod; if (k > 0.1 && r0 == null) r0 = t; if (r0 != null && (k <= 0.1 || t + 0.1 > story.LEN)) { rods.push({ who: A.id, t0: r2(r0), t1: r2(t) }); r0 = null; } }
  } else if (C?.kind === 'heli') {
    // how near the helicopter is to the action (to the first actor) every tenth of a second
    const path = [];
    for (let t = 0; t <= story.LEN; t += 0.1) { const p = rt.pos(A.id, t), q = rt.pos(rt.actors[0].id, t); path.push([r2(t), r2(Math.hypot(p.x - q.x, p.y - q.y - 1, p.z - q.z))]); }
    helis.push({ who: A.id, path });
  }
}
const cues = rt.cues.map((c) => { const o = { t: r2(c.t), kind: c.kind, by: c.by }; for (const k of ['t1', 'k', 'hit', 'big', 'model', 'boom', 'name', 'bind', 'n']) if (c[k] != null) o[k] = typeof c[k] === 'number' ? r2(c[k]) : c[k]; return o; });
console.log(JSON.stringify({ ep, LEN: story.LEN, T: story.T, cues, steps: steps.sort((a, b) => a.t - b.t), jets, rods, helis, music: story.music }, null, 1));
