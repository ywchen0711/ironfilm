// A story at work: given a script (js/story/*.js), where every actor is, which way it faces and how it is posed at
// any moment, and the whole list of timed cues (effects and sounds) its actions set off. Pure arithmetic: the film
// draws from it, and tools/cues.mjs hands the same cues to the sound mix.
import { ACT } from './actions.js?v=5';
import { S, cl } from './util.js?v=5';
import { planFeet } from '../feet.js?v=5';
import { CHARACTERS } from '../cast/characters.js?v=5';

const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const lerpAngle = (a, b, k) => a + wrap(b - a) * k;

export function createRuntime(story) {
  const actors = story.actors.map((A, i) => ({ ...A, i, kx: A.kx ?? CHARACTERS[A.who]?.kx, track: (A.track || []).map((a) => ({ ...a, self: A.id })) }));
  const by = Object.fromEntries(actors.map((a) => [a.id, a]));
  // every blade met by a weapon: the defender's arm reaches for the blade (unless the story already holds that arm)
  for (const A of actors) for (const a of A.track) {
    if (a.do !== 'blow' || a.result !== 'clash' || !by[a.target] || a.parry === false) continue;
    const side = (a.against || 'tipL').endsWith('R') ? 'R' : 'L';
    by[a.target].track.push({ do: 'parry', t: a.t, side, to: `${A.id}.tip${a.arm || 'R'}`, hold: a.bind ? a.bind : 0.22, self: a.target, auto: true });
  }
  const floorOf = (A, t) => { let y = A.floor?.[0]?.[1] ?? 0; for (const [ft, fy] of A.floor || []) if (t >= ft) y = fy; return y; };
  // the distance an anchored actor keeps: moves add up; a run of blows lunges by the deepest one, not their sum
  const distDelta = (A, t) => { let d = 0, lunge = 0; for (const a of A.track) { const f = ACT[a.do]?.dist; if (!f) continue; const v = f(t, a); if (a.do === 'blow') lunge = Math.min(lunge, v); else d += v; } return d + lunge; };
  // everything here is a pure function of the time, and actors look each other up a great deal: remember the answers
  const memo = (fn, cap = 400000) => { let m = new Map(); return (key, ...args) => { let v = m.get(key); if (v === undefined) { if (m.size > cap) m = new Map(); v = fn(...args); m.set(key, v); } return v; }; };
  const beforeM = memo((A, i, t) => run(A, t, null, i)), baseM = memo((A, t) => run(A, t, (a) => a.do !== 'anchor' && a.do !== 'charge'));
  const W = (A) => ({ T: story.T, self: A.id, pos: (id, t) => pos(id, t), basePos: (t) => basePos(A, t), distDelta: (t) => distDelta(A, t), before: (act, t) => { const i = A.track.indexOf(act); return beforeM(`${A.id}|${i}|${t}`, A, i, t); } });
  const Ws = new Map(actors.map((A) => [A.id, W(A)]));
  function run(A, t, only, upto = Infinity) {
    const p = { x: A.start[0], y: floorOf(A, t) + (A.start[2] || 0), z: A.start[1] }; // start: [x, z] or [x, z, height]
    for (let i = 0; i < A.track.length && i < upto; i++) { const a = A.track[i], f = ACT[a.do]?.move; if (f && (!only || only(a))) f(p, t, a, Ws.get(A.id)); }
    return p;
  }
  const basePos = (A, t) => baseM(`${A.id}|${t}`, A, t);
  let depth = 0; const posM = memo((A, t) => run(A, t));
  function pos(id, t) {
    if (!by[id]) throw new Error(`no actor '${id}'`);
    if (++depth > 60) { depth = 0; throw new Error(`positions refer to each other in a circle (at ${id}, t=${t.toFixed(2)}): a goto, charge or anchor must only look at another actor at a time before it starts`); }
    try { return posM(`${id}|${t}`, by[id], t); } finally { depth--; }
  }
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
  const stateM = memo((id, t) => stateOf(id, t), 200000);
  function state(id, t) { return stateM(`${id}|${t}`, id, t); }
  function stateOf(id, t) {
    const A = by[id];
    const s = {
      pose: { t, walk: 0, phase: 0, aim: 0, muzzle: false, recoil: 0, stance: A.stance0 ?? 1, sway: Math.sin(t * 1.2 + A.i * 2) * 0.6, twist: 0.28, lean: 0, guard: 0, crouch: 0.05, roll: 0, kickR: 0, kickL: 0, headKick: 0, armR: null, armL: null, wristL: 0, wristR: 0, look: 0 },
      jets: 0, rod: 0, skate: false, kneel: 0, hidden: false, ik: null, sink: 0, tilt: 0, limp: 0, lookW: 0.85, spot: 0, dead: false, hp: { body: 100, armL: 100, armR: 100, legs: 100 }, gone: {},
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
  // hit-stop: the world freezes for a moment at each heavy blow (only where the story has no slow motion already)
  const stops = story.hitstop === false ? [] : cues.filter((c) => (c.kind === 'hit' || c.kind === 'clash') && (c.k ?? 1) >= (story.hitstopK ?? 1.2))
    .map((c) => [c.t, c.t + 0.06, 0.2, 'stop']).filter(([a]) => !(story.warp || []).some(([w0, w1]) => a > w0 - 0.2 && a < w1 + 0.2));
  const warp = [...(story.warp || [])]; for (const s of stops) if (!warp.some(([a, b]) => s[0] < b && s[1] > a)) warp.push(s);
  return { story, actors, by, pos, yaw, state, cues, feet, warp, floor: (id, t) => floorOf(by[id], t) };
}
export { lerpAngle };
