// A story at work: given a script (js/story/*.js), where every actor is, which way it faces and how it is posed at
// any moment, and the whole list of timed cues (effects and sounds) its actions set off. Pure arithmetic: the film
// draws from it, and tools/cues.mjs hands the same cues to the sound mix.
import { ACT } from './actions.js?v=3';
import { S, cl } from './util.js?v=3';
import { planFeet } from '../feet.js?v=3';

const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const lerpAngle = (a, b, k) => a + wrap(b - a) * k;

export function createRuntime(story) {
  const actors = story.actors.map((A, i) => ({ ...A, i, track: (A.track || []).map((a) => ({ ...a, self: A.id })) }));
  const by = Object.fromEntries(actors.map((a) => [a.id, a]));
  const floorOf = (A, t) => { let y = A.floor?.[0]?.[1] ?? 0; for (const [ft, fy] of A.floor || []) if (t >= ft) y = fy; return y; };
  const distDelta = (A, t) => { let d = 0; for (const a of A.track) if (ACT[a.do]?.dist) d += ACT[a.do].dist(t, a); return d; };
  const W = (A) => ({ T: story.T, self: A.id, pos: (id, t) => pos(id, t), basePos: (t) => basePos(A, t), distDelta: (t) => distDelta(A, t), before: (act, t) => run(A, t, null, A.track.indexOf(act)) });
  const Ws = new Map(actors.map((A) => [A.id, W(A)]));
  function run(A, t, only, upto = Infinity) {
    const p = { x: A.start[0], y: floorOf(A, t) + (A.start[2] || 0), z: A.start[1] }; // start: [x, z] or [x, z, height]
    for (let i = 0; i < A.track.length && i < upto; i++) { const a = A.track[i], f = ACT[a.do]?.move; if (f && (!only || only(a))) f(p, t, a, Ws.get(A.id)); }
    return p;
  }
  const basePos = (A, t) => run(A, t, (a) => a.do !== 'anchor' && a.do !== 'charge');
  function pos(id, t) { return run(by[id], t); }
  // facing: at the actor named by `face` (or along its path), unless a 'face' action turns it
  function yaw(id, t) {
    const A = by[id], p = pos(id, t);
    let y;
    if (A.face) { const q = pos(A.face, t); y = Math.atan2(q.x - p.x, q.z - p.z); }
    else { const q = pos(id, t + 0.1), dx = q.x - p.x, dz = q.z - p.z; y = Math.hypot(dx, dz) > 0.01 ? Math.atan2(dx, dz) : A.yaw0 || 0; }
    for (const a of A.track) {
      if (a.do !== 'face') continue;
      const b = a.blend ?? 0.3, w = S(t, a.t - b, a.t) * (1 - S(t, a.t1 ?? 999, (a.t1 ?? 999) + b)); if (!w) continue;
      let ty = a.yaw; if (ty == null) { const q = pos(a.to, t); ty = Math.atan2(q.x - p.x, q.z - p.z); }
      y = lerpAngle(y, ty, w);
    }
    return y;
  }
  function state(id, t) {
    const A = by[id];
    const s = {
      pose: { t, walk: 0, phase: 0, aim: 0, muzzle: false, recoil: 0, stance: A.stance0 ?? 1, sway: Math.sin(t * 1.2 + A.i * 2) * 0.6, twist: 0.28, lean: 0, guard: 0, crouch: 0.05, roll: 0, kickR: 0, kickL: 0, headKick: 0, armR: null, armL: null, wristL: 0, wristR: 0, look: 0 },
      jets: 0, rod: 0, skate: false, kneel: 0, sink: 0, tilt: 0, limp: 0, lookW: 0.85, spot: 0, dead: false, hp: { body: 100, armL: 100, armR: 100, legs: 100 }, gone: {},
    };
    for (const a of A.track) ACT[a.do]?.pose?.(s, t, a, Ws.get(A.id));
    s.pose.crouch = cl(s.pose.crouch, 0, 1);
    return s;
  }
  // every cue the actions set off, and the script's own, in time order
  const cues = [];
  for (const A of actors) for (const a of A.track) { const f = ACT[a.do]?.cues; if (f) cues.push(...f(a, Ws.get(A.id)).map((c) => ({ ...c, by: A.id }))); }
  cues.push(...(story.cues || [])); cues.sort((a, b) => a.t - b.t);
  // footwork for every walker
  const feetCache = {};
  function feet(id) {
    if (feetCache[id]) return feetCache[id];
    const A = by[id];
    return (feetCache[id] = planFeet({
      root: (t) => { const p = pos(id, t), s = state(id, t); return { x: p.x, y: p.y - s.sink, z: p.z }; },
      floor: (t) => floorOf(A, t), yaw: (t) => yaw(id, t), len: story.LEN, kx: A.kx || 1,
      stance: (t) => state(id, t).pose.stance, crouch: (t) => state(id, t).pose.crouch, skate: (t) => state(id, t).skate, kneel: (t) => state(id, t).kneel,
    }));
  }
  return { story, actors, by, pos, yaw, state, cues, feet, floor: (id, t) => floorOf(by[id], t) };
}
export { lerpAngle };
