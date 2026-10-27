// The move library. A script (js/story/*.js) gives each actor a track of actions like
//   { do: 'walk', t: 0, t1: 6.6, v: [1.15, 0] }      { do: 'blow', t: 17.4, style: 'side', result: 'clash', target: 'ron' }
// and each kind of action, here, knows three things, all pure arithmetic:
//   move(p, t, a, W)    how it moves the actor (p = {x, y, z}, changed in place)
//   pose(s, t, a, W)    how it poses the actor (s.pose = the engine's pose parameters, plus s.jets, s.rod, s.hp, ...)
//   cues(a, W)          what it sets off: effects and sounds, as timed cues (see core/runtime.js and core/director.js)
// W gives the time-bound world: W.pos(id, t) another actor's place, W.T the story's beats, W.self the actor.
import { cl, seg, ss, S, bump, imp, lerp, ease, shape, spline, H } from './util.js?v=5';

const REST = { s: -0.5, e: -0.9 };
const mixArm = (a, b, k) => ({ s: a.s + (b.s - a.s) * k, e: a.e + (b.e - a.e) * k });
const dirOf = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return { x: dx / l, z: dz / l }; };
// a blow's five beats: close in, wind up and hold, strike, follow through, step back
export const closeIn = (t, te) => { const dt = t - te; return ss(cl((dt + 0.9) / 0.55)) * (1 - ss(cl((dt - 0.3) / 0.45))); };
// A blow, with the whole body. Each style has three poses: the wind-up (weight back, the free arm up on guard), the
// strike (weight driving forward, the body sinking into it, the free arm pulled back to balance it) and the follow-
// through; the body eases back to rest afterwards. Every blow has its own speed (a.speed, or a little random), so a
// run of them never ticks like a metronome.
const STYLE = {
  side: { W: { arm: { s: -1.45, e: -0.3 }, off: { s: -0.9, e: -1.3 }, twist: 0.85, lean: -0.06, crouch: 0.12, roll: 0.06, wrist: 1.2 }, S: { arm: { s: -1.45, e: -0.15 }, off: { s: 0.25, e: -0.5 }, twist: -0.75, lean: 0.16, crouch: 0.28, roll: -0.08, wrist: 1.2 }, F: { twist: -1.0, lean: 0.1, crouch: 0.2, roll: -0.05 } },
  over: { W: { arm: { s: -2.8, e: -0.4 }, off: { s: -1.3, e: -0.9 }, twist: 0.25, lean: -0.12, crouch: 0.05, headKick: -0.15, wrist: 0 }, S: { arm: { s: -0.6, e: -0.2 }, off: { s: 0.3, e: -0.4 }, twist: -0.1, lean: 0.22, crouch: 0.32, headKick: 0.1, wrist: 0 }, F: { lean: 0.15, crouch: 0.25 } },
  thrust: { W: { arm: { s: -0.15, e: -1.9 }, off: { s: -1.0, e: -1.2 }, twist: 0.55, lean: -0.1, crouch: 0.15, wrist: 1.5 }, S: { arm: { s: -1.6, e: 0 }, off: { s: 0.35, e: -0.3 }, twist: -0.35, lean: 0.25, crouch: 0.3, wrist: 1.5 }, F: { twist: -0.45, lean: 0.18, crouch: 0.22 } },
  upper: { W: { arm: { s: 0.35, e: -0.5 }, off: { s: -0.8, e: -1.4 }, twist: 0.4, lean: 0.15, crouch: 0.6, wrist: 0 }, S: { arm: { s: -2.5, e: -0.45 }, off: { s: 0.4, e: -0.3 }, twist: -0.3, lean: -0.15, crouch: 0, headKick: -0.15, wrist: -0.8 }, F: { twist: -0.35, lean: -0.1 } },
};
const blowBody = (style, dt, a) => {
  const P = STYLE[style] || STYLE.over, sp = a.speed ?? 0.88 + 0.3 * H(a.t, 77), mirror = (a.arm || 'R') === 'L' ? -1 : 1;
  const k1 = ss(cl((dt + 0.36 * sp) / (0.26 * sp))), k2 = ss(cl((dt + 0.08 * sp) / (0.08 * sp))), k3 = ss(cl(dt / 0.18)), back = 1 - ss(cl((dt - 0.3) / 0.45));
  const val = (k) => { const w = P.W[k] || 0, s2 = P.S[k] ?? w, f = P.F?.[k] ?? s2; return ((w * k1) * (1 - k2) + s2 * k2 * (1 - k3) + f * k2 * k3) * back; };
  const arm = mixArm(REST, k2 > 0 ? mixArm(P.W.arm, P.S.arm, k2) : mixArm(REST, P.W.arm, k1), back);
  const off = mixArm(REST, k2 > 0 ? mixArm(P.W.off, P.S.off, k2) : mixArm(REST, P.W.off, k1), back);
  const lean = (style === 'over' ? a.lean || 0 : 0);
  return { arm, off, wrist: (k2 > 0 ? P.S.wrist : P.W.wrist * k1) * back, twist: val('twist') * mirror, lean: val('lean') + lean * k2 * back, crouch: val('crouch') + lean * k2 * back, roll: val('roll') * mirror, headKick: val('headKick'), on: Math.max(k1, k2) * back, sp };
};
const addP = (s, k, v) => { s.pose[k] = (s.pose[k] || 0) + v; };
const ref = (actor, part) => `${actor}.${part}`;

export const ACT = {
  // ---------------------------------------------------------------- moving
  // at a steady speed v = [vx, vz] from t to t1, braking over `stop` seconds
  walk: {
    move(p, t, a) { if (t <= a.t) return; const run = Math.min(t, a.t1) - a.t, st = a.stop ?? 0.8, d = Math.min(st, Math.max(0, t - a.t1)), k = run + (st ? d - d * d / (2 * st) : 0); p.x += a.v[0] * k; p.z += a.v[1] * k; },
  },
  // by d = [dx, dz] between t and t1
  move: { move(p, t, a) { const k = ease(seg(t, a.t, a.t1), a.e); p.x += a.d[0] * k; p.z += a.d[1] * k; } },
  // a jump: up by h, across by d, on the jets; crouches before and on landing
  jump: {
    move(p, t, a) { const k = seg(t, a.t, a.t1); p.x += (a.d?.[0] || 0) * ss(k); p.z += (a.d?.[1] || 0) * ss(k); if (t > a.t && t < a.t1) p.y += a.h * Math.pow(Math.sin(Math.PI * k), a.h > 1 ? 0.8 : 1); },
    pose(s, t, a) {
      addP(s, 'crouch', 0.45 * bump(t, a.t - 0.22, a.t + 0.05) + 0.3 * bump(t, a.t, a.t1) + (a.land ?? 0.85) * imp(t - a.t1, 0.06, a.recover ?? 2.6));
      s.jets = Math.max(s.jets, (a.jets ?? 1) * bump(t, a.t - 0.05, Math.min(a.t1, a.t + (a.burn ?? a.t1 - a.t))));
      addP(s, 'lean', (a.lean ?? -0.12) * bump(t, a.t, a.t1));
    },
  },
  // dropping from a height (a rooftop) to the street at `to` = [x, z]
  drop: {
    move(p, t, a) { if (t < a.t) return; const k = seg(t, a.t, a.t1); p.x += (a.to[0] - a.from[0]) * ss(k); p.z += (a.to[1] - a.from[2]) * ss(k); if (t < a.t1) p.y = a.from[1] * (1 - k * k) + 0.7 * Math.sin(k * Math.PI); },
    pose(s, t, a) { if (t < a.t1) { addP(s, 'crouch', 0.3); s.jets = Math.max(s.jets, 1.1 * bump(t, a.t - 0.1, a.t1 + 0.1)); } const k = imp(t - a.t1, 0.05, 2.2); addP(s, 'crouch', 0.95 * k); addP(s, 'lean', 0.3 * k); },
  },
  // keep to a distance from another actor (melee range): blends in, and lets go at t1 if `release`
  anchor: {
    move(p, t, a, W) {
      if (t < a.t || (a.t1 != null && t > a.t1 + (a.release || 0))) return;
      const tg = W.pos(a.to, t), dir = a.dir ? { x: a.dir[0], z: a.dir[1] } : dirOf(tg, W.basePos(a.t));
      const D = (a.dist ?? 1.6) + W.distDelta(t);
      let w = S(t, a.t, a.t + (a.blend ?? 0.3)); if (a.t1 != null && a.release) w *= 1 - S(t, a.t1, a.t1 + a.release);
      p.x = lerp(p.x, tg.x + dir.x * D, w); p.z = lerp(p.z, tg.z + dir.z * D, w);
      if (a.z != null) p.z = lerp(p.z, a.z, w);
    },
  },
  // a charge on the jets, straight at someone, arriving at t1 `gap` away
  charge: {
    move(p, t, a, W) {
      if (t < a.t) return;
      const tg = W.pos(a.to, a.t1), from = W.basePos(a.t), dir = dirOf(tg, from), end = { x: tg.x + dir.x * (a.gap ?? 1.1), z: tg.z + dir.z * (a.gap ?? 1.1) };
      const k = seg(t, a.t, a.t1 - 0.05), kk = k < 0.3 ? k * k / 0.6 : (k - 0.15) / 0.85;
      p.x = lerp(from.x, end.x, kk); p.z = lerp(from.z, end.z, kk); if (t < a.t1) p.y += (a.hover ?? 0.06) * bump(t, a.t, a.t1);
    },
    pose(s, t, a) {
      addP(s, 'crouch', 0.55 * S(t, a.t - 0.9, a.t) * (t < a.t1 ? 1 : 0)); addP(s, 'lean', 0.3 * S(t, a.t - 0.9, a.t) * (t < a.t1 ? 1 : 0));
      if (t > a.t && t < a.t1) { s.jets = Math.max(s.jets, a.jets ?? 1.3); s.skate = !!(a.skate ?? true); if (a.armBack !== false) { s.pose.armR = { s: 0.6, e: -0.3 }; s.pose.wristR = 0.4; } }
    },
  },
  // a lunge in and back out again (for blows by the actor the anchor does not belong to)
  distBump: { dist(t, a) { return a.d * bump(t, a.t, a.t1); } },
  // the distance kept by `anchor` changes by d between t and t1 (pushed back, stepping in)
  dist: { dist(t, a) { return a.d * ease(seg(t, a.t, a.t1), a.e); } },
  // go to a place: to = [x, z], or { rel: 'hound', at: 120, off: [dx, dz] } (a place next to another actor at a given
  // moment). Starts from wherever the earlier moves had it at t; holds the place afterwards.
  goto: {
    move(p, t, a, W) {
      if (t < a.t) return;
      const q = W.before(a, a.t), to = Array.isArray(a.to) ? { x: a.to[0], z: a.to[1] } : (() => { const r = W.pos(a.to.rel, a.to.at ?? a.t1); return { x: r.x + (a.to.off?.[0] || 0), z: r.z + (a.to.off?.[1] || 0) }; })();
      const k = ease(seg(t, a.t, a.t1), a.e || 'ss'); p.x = q.x + (to.x - q.x) * k; p.z = q.z + (to.z - q.z) * k;
      if (a.hover && t < a.t1) p.y += a.hover * bump(t, a.t, a.t1);
    },
    pose(s, t, a) { if (t > a.t && t < a.t1) { if (a.jets) s.jets = Math.max(s.jets, a.jets); if (a.skate) s.skate = true; } },
  },
  // stay where the earlier moves had put it at t (then let the later moves carry on from there)
  pin: { move(p, t, a, W) { if (t < a.t) return; const q = W.before(a, a.t); p.x = q.x; p.z = q.z; } },
  // flying (a helicopter): a smooth path through [t, x, y, z] keys
  fly: { move(p, t, a) { const q = spline(a.keys, t); p.x = q.x; p.y = q.y; p.z = q.z; } },

  // ---------------------------------------------------------------- standing and posing
  stance: { pose(s, t, a) { s.pose.stance = lerp(s.pose.stance, a.k ?? 1, S(t, a.t, a.t1 ?? a.t + 0.6)); } },
  // any pose parameters (crouch, lean, twist, roll, guard, aim, headKick, kickL, kickR, look, jets, rod, kneel, ...)
  // added in over a shape: { do: 'p', t, t1, set: { crouch: 0.5 }, shape: 'bump' }
  p: {
    pose(s, t, a) {
      const k = shape(t, a.t, a.t1, a.shape, a.ramp); if (!k) return;
      for (const [n, v] of Object.entries(a.set)) { if (n in s && n !== 'pose') s[n] = (s[n] || 0) + v * k; else addP(s, n, v * k); }
    },
  },
  // an arm through keyframes [[t, shoulder, elbow, wrist], ...]
  arm: {
    pose(s, t, a) {
      const K = a.keys, side = a.side || 'L'; if (t < K[0][0] - (a.blendIn ?? 0.15) || t > K[K.length - 1][0] + (a.blendOut ?? 0.25)) return;
      let v;
      if (t <= K[0][0]) v = mixArm(REST, { s: K[0][1], e: K[0][2] }, S(t, K[0][0] - (a.blendIn ?? 0.15), K[0][0]));
      else if (t >= K[K.length - 1][0]) { const L = K[K.length - 1]; v = mixArm({ s: L[1], e: L[2] }, REST, S(t, L[0], L[0] + (a.blendOut ?? 0.25))); }
      else { let i = 0; while (K[i + 1][0] < t) i++; const k = ss(seg(t, K[i][0], K[i + 1][0])); v = mixArm({ s: K[i][1], e: K[i][2] }, { s: K[i + 1][1], e: K[i + 1][2] }, k); s.pose['wrist' + side] = lerp(K[i][3] || 0, K[i + 1][3] || 0, k); }
      s.pose['arm' + side] = v;
    },
  },
  // a blow with the weapon hand, landing at t: 'side', 'over', 'thrust' or 'upper'. result: 'clash' (blade meets
  // the other's weapon), 'hit' (on the target's `part`), 'ground' (misses into the street)
  blow: {
    dist(t, a) { return a.close === false ? 0 : -(a.reach ?? 0.55) * closeIn(t, a.t); },
    pose(s, t, a) {
      const dt = t - a.t; if (dt < -0.9 || dt > 0.75) return;
      const o = blowBody(a.style, dt, a), side = a.arm || 'R', other = side === 'R' ? 'L' : 'R';
      if (dt > -0.36 * o.sp) { s.pose['arm' + side] = o.arm; s.pose['wrist' + side] = o.wrist; }
      if (a.offhand !== false && o.on > 0.01) s.pose['arm' + other] = mixArm(s.pose['arm' + other] || REST, o.off, 0.6 * o.on); // the free arm balances the blow
      addP(s, 'twist', o.twist); addP(s, 'lean', o.lean); addP(s, 'crouch', o.crouch); addP(s, 'roll', o.roll); addP(s, 'headKick', o.headKick);
    },
    cues(a) {
      const c = [{ t: a.t - 0.16, kind: 'whoosh', k: a.k ?? 1 }], me = a.self, weap = ref(me, 'tip' + (a.arm || 'R'));
      if (a.result === 'clash') c.push({ t: a.t, kind: 'clash', a: weap, b: ref(a.target, a.against || 'tipL'), k: a.k ?? 1 });
      else if (a.result === 'hit') c.push({ t: a.t, kind: 'hit', at: ref(a.target, a.part || 'chest'), k: a.k ?? 1, from: weap });
      else if (a.result === 'ground') c.push({ t: a.t + 0.02, kind: 'ground', at: { actor: me, part: 'front', off: [0, 0, 0.9] }, k: a.k ?? 1 });
      return c;
    },
  },
  // hit: thrown back where it was struck
  react: {
    pose(s, t, a) {
      const dt = t - a.t; if (dt < 0 || dt > 2) return;
      const heavy = (a.k ?? 1), I = imp(dt, 0.05, a.decay ?? 3), r = (H(a.t, 31) - 0.5);
      if (a.part === 'body' || a.part === 'chest') { addP(s, 'lean', -0.34 * heavy * I); addP(s, 'headKick', 0.9 * heavy * I); addP(s, 'roll', r * 0.3 * heavy * I); }
      else if (a.part === 'armR') { addP(s, 'kickR', 1.1 * heavy * I); addP(s, 'twist', 0.45 * heavy * I); addP(s, 'roll', 0.08 * heavy * I); addP(s, 'headKick', 0.3 * heavy * I); }
      else if (a.part === 'armL') { addP(s, 'kickL', 1.1 * heavy * I); addP(s, 'twist', -0.45 * heavy * I); addP(s, 'roll', -0.08 * heavy * I); }
      else if (a.part === 'head') { addP(s, 'headKick', 1.1 * heavy * I); addP(s, 'lean', -0.3 * heavy * I); }
      else { addP(s, 'crouch', 0.8 * heavy * I); addP(s, 'roll', r * 0.35 * heavy * I); }
    },
  },
  // fire a gun: n rounds every `rate` s; `hits` lists the rounds that strike the target's chest
  burst: {
    pose(s, t, a) {
      for (let k = 0; k < a.n; k++) { const dt = t - (a.t + k * a.rate); if (dt > -0.01 && dt < 0.04) { s.pose.muzzle = true; s.pose.recoil = 1; } }
    },
    cues(a, W) {
      const c = [];
      for (let k = 0; k < a.n; k++) {
        const t = a.t + k * a.rate, hit = (a.hits || []).includes(k), tp = W.pos(a.target, t), n = Math.round(a.t * 100) + k;
        const to = hit ? ref(a.target, a.part || 'chest') : [tp.x + (a.missAt?.[0] ?? 2) + H(n, 1) * (a.missSpread ?? 4), 0.1 + H(n, 2) * 2.4 + (a.missAt?.[1] ?? 0), tp.z + (H(n, 3) - 0.45) * 2.6 + (a.missAt?.[2] ?? 0)];
        c.push({ t, kind: 'shot', from: ref(a.self, a.from || 'muzzle'), to, hit, fly: a.fly ?? 0.2, big: !!a.big, n });
      }
      return c;
    },
  },
  // a missile or rocket from `from` to where the target will be (plus `off`), landing at `at`; `boom` sets the blast
  missile: {
    pose(s, t, a) { const k = imp(t - a.t, 0.04, 6); addP(s, 'lean', -0.12 * k * (a.recoil ?? 1)); addP(s, 'headKick', 0.1 * k * (a.recoil ?? 1)); },
    cues(a, W) {
      const tp = a.to ? { x: a.to[0], y: a.to[1], z: a.to[2] } : W.pos(a.target, a.at), off = a.off || [0, 0, 0];
      const to = [tp.x + off[0], (a.to ? tp.y : 0.15) + off[1], tp.z + off[2]];
      return [{ t: a.t, t1: a.at, kind: 'missile', model: a.model || 'missile', from: ref(a.self, a.from || 'launcher'), to, arc: a.arc ?? 3.4, side: a.side ?? 1.5, boom: a.boom ?? 1.2, n: Math.round(a.t * 100) }];
    },
  },
  // a salvo of rockets from both pods
  rockets: {
    cues(a, W) {
      const c = [];
      for (let k = 0; k < a.n; k++) {
        const t = a.t + k * (a.rate ?? 0.09), at = a.at + k * (a.rate ?? 0.09), tp = W.pos(a.target, at), n = Math.round(t * 100);
        const to = [tp.x + (H(n, 4) - 0.5) * (a.spread ?? 1.4) + (a.off?.[0] || 0), 0.15 + H(n, 5) * 1.1, tp.z + (H(n, 6) - 0.5) * (a.spread ?? 1.4) + (a.off?.[2] || 0)];
        c.push({ t, t1: at, kind: 'missile', model: 'rocket', from: ref(a.self, k % 2 ? 'podR' : 'podL'), to, arc: 0.6, side: 0, boom: a.boom ?? 0.75, n });
      }
      return c;
    },
  },
  // a swarm of micro-missiles, each corkscrewing on its own path (the "Itano circus"); `decoys` of them are lost
  // to flares and burst short, the rest strike the target
  swarm: {
    pose(s, t, a) { const k = shape(t, a.t - 0.2, a.t + a.n * (a.rate ?? 0.06), 'hold', 0.1); addP(s, 'lean', -0.08 * k); },
    cues(a, W) {
      const c = [];
      for (let k = 0; k < a.n; k++) {
        const t = a.t + k * (a.rate ?? 0.06), n = Math.round(t * 100) + k, lost = k < (a.decoys ?? 0);
        const at = (a.at ?? a.t + 2) + k * (a.rate ?? 0.06) * 0.6 + H(n, 7) * 0.3, tp = W.pos(a.target, at);
        const to = lost ? [tp.x + (H(n, 4) - 0.5) * 6, tp.y - 1.5 - H(n, 5) * 2, tp.z + (H(n, 6) - 0.5) * 6] : [tp.x + (H(n, 4) - 0.5) * 0.8, tp.y + (H(n, 5) - 0.5) * 0.5, tp.z + (H(n, 6) - 0.5) * 0.8];
        c.push({ t, t1: at, kind: 'missile', model: 'micro', from: ref(a.self, 'launcher'), to, arc: 2 + H(n, 8) * 3, side: (H(n, 9) - 0.5) * 6, spiral: 0.6 + H(n, 10) * 0.8, turns: 2 + H(n, 11) * 2, boom: lost ? 0.35 : 0.5, n });
      }
      return c;
    },
  },
  flares: { cues(a) { return [{ t: a.t, kind: 'flares', at: ref(a.self, 'body'), n: a.n ?? 14 }]; } },
  // an arm reaching out to meet a weapon (solved by IK at draw time, js/rig.js); the runtime adds one to the defender
  // of every blow that ends in a clash
  parry: { pose(s, t, a) { const w = shape(t, a.t - (a.lead ?? 0.32), a.t + (a.hold ?? 0.25), 'hold', 0.16); if (w > 0.01) (s.ik ||= []).push({ side: a.side || 'L', to: a.to, w: w * (a.k ?? 1) }); } },
  jets: { pose(s, t, a) { s.jets = Math.max(s.jets, (a.k ?? 1) * shape(t, a.t, a.t1, a.shape || 'hold', 0.08)); } },
  rod: { pose(s, t, a) { s.rod = Math.max(s.rod, (a.k ?? 1) * shape(t, a.t, a.t1, 'hold', 0.5)); } },
  // down on one knee (the feet re-plant for it, js/feet.js)
  kneel: {
    pose(s, t, a) {
      const k = shape(t, a.t, a.t1, 'hold', a.ramp ?? 0.4); if (!k) return;
      s.kneel = Math.max(s.kneel, k); addP(s, 'lean', 0.18 * k); addP(s, 'headKick', -0.15 * k); s.pose.guard = Math.max(s.pose.guard, 0.3 * k);
    },
  },
  // a part breaks off; a weapon is knocked from the hand
  sever: { pose(s, t, a) { if (t >= a.t) s.hp[a.part] = 0; }, cues(a) { return [{ t: a.t, kind: 'loose', what: ref(a.self, a.part), k: a.k ?? 1, v: a.v }]; } },
  // knocked from the hand; picked up again at t1 if given
  disarm: { pose(s, t, a) { if (t >= a.t && t < (a.t1 ?? 1e9)) s.gone[a.slot] = true; }, cues(a) { return [{ t: a.t, t1: a.t1, kind: 'loose', what: ref(a.self, a.slot), k: a.k ?? 1, v: a.v }]; } },
  // broken from the start (a part lost in an earlier episode)
  broken: { pose(s, t, a) { if (t >= a.t) s.hp[a.part] = 0; } },
  hide: { pose(s, t, a) { if (t >= a.t && t < (a.t1 ?? 1e9)) s.hidden = true; } },
  die: { pose(s, t, a) { if (t >= a.t) { s.dead = true; s.hp.body = 0; } } },
  // falling over backwards
  fall: {
    pose(s, t, a) {
      if (t < a.t) return; const k = S(t, a.t, a.t1);
      s.tilt += -1.2 * Math.pow(k, 1.6); s.sink += 0.2 * k; s.limp = Math.max(s.limp, S(t, a.t, a.t + 0.35)); s.pose.stance *= 1 - S(t, a.t, a.t + 0.4); s.lookW = 0;
    },
  },
  // which way it faces: at another actor, or a fixed heading
  face: { face(t, a) { return { w: shape(t, a.t, a.t1 ?? 99, 'hold', a.blend ?? 0.3), to: a.to, yaw: a.yaw }; } },
  lookat: { pose(s, t, a) { if (t >= a.t && t <= a.t1) s.lookTo = a.to; } },
  look: { pose(s, t, a) { s.lookW = lerp(s.lookW, a.w, shape(t, a.t, a.t1 ?? 99, 'hold', 0.3)); } },
  spot: { pose(s, t, a) { s.spot = Math.max(s.spot, shape(t, a.t, a.t1 ?? 99, 'hold', 0.4)); } },
  // a held fighting guard with an arm (blocking with the rod, say)
  guard: { pose(s, t, a) { const k = shape(t, a.t, a.t1, 'hold', 0.3); if (k) { const side = a.side || 'L'; s.pose['arm' + side] = mixArm(REST, a.arm || { s: -1.35, e: -1.2 }, k); s.pose['wrist' + side] = (a.wrist ?? -0.5) * k; } } },
};
