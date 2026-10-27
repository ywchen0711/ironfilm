// The effects director: turns the story's cues into what is seen, every frame. Positions in a cue are:
//   'hound.chest'        a named point on an actor (js/core/actors3d.js), where it is now
//   'hound'              an actor's place on the ground
//   [x, y, z]            a place in the world
//   { actor, part, off } a named point plus an offset ('front' takes the offset in the actor's own frame)
// Things that must not follow their actor once set off (a blast, a missile's launch, a severed arm) are fixed where
// they were at the cue's time: prepare() poses the whole stage at each such moment once, at load.
// Cue kinds: shot, missile, explosion, hit, ground, clash, flares, loose, fire, arc, sparks, smoke, flash, shake,
// and sound-only kinds (whoosh, snd), which the director ignores.
import * as THREE from '../../engine/lib/three.module.min.js';
import { missileModel } from '../models/weapons.js?v=5';
import { H, S, imp } from './util.js?v=5';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const FIXED = new Set(['explosion', 'hit', 'ground', 'clash', 'flares', 'sparks', 'fire', 'column', 'pod']);

export function createDirector({ scene, fx, rt, views }) {
  const cues = rt.cues;
  function resolve(spec, t) {
    if (!spec) return V();
    if (Array.isArray(spec)) return V(...spec);
    if (typeof spec === 'string') {
      const [id, part] = spec.split('.'), v = views[id];
      if (part && v?.points[part]) return v.points[part]();
      const p = rt.pos(id, t); return V(p.x, p.y, p.z);
    }
    if (spec.part === 'front') return views[spec.actor].points.front(spec.off);
    // an offset in the part's own frame (x to its left, y up, z ahead): a camera that turns with a head
    if (spec.local) { const o = views[spec.actor]?.frames?.[spec.part]; if (o) { o.updateWorldMatrix(true, false); return V(...(spec.off || [0, 0, 0])).applyMatrix4(o.matrixWorld); } }
    return resolve(spec.part ? `${spec.actor}.${spec.part}` : spec.actor, t).add(V(...(spec.off || [0, 0, 0])));
  }
  const pool = { missile: [], rocket: [], micro: [] };
  const flying = (kind, i) => { const P = pool[kind]; while (P.length <= i) { const m = missileModel(kind); m.group.visible = false; scene.add(m.group); P.push(m); } return P[i]; };
  const looseObjs = new Map();

  // pose the stage at each moment a cue fixes something, once
  function prepare(poseAll) {
    for (const c of cues) {
      if (c.kind === 'missile') { poseAll(c.t); c.fromW = resolve(c.from, c.t); c.toW = Array.isArray(c.to) ? V(...c.to) : resolve(c.to, c.t1); }
      else if (c.kind === 'clash') { poseAll(c.t); c.atW = resolve(c.a, c.t).lerp(resolve(c.b, c.t), 0.5); }
      else if (c.kind === 'loose') {
        poseAll(c.t - 1 / 60); const [id, part] = c.what.split('.'), src = views[id]?.looseOf(part); if (!src) continue;
        src.updateWorldMatrix(true, true); const obj = src.clone(true); obj.visible = false; scene.add(obj);
        const m0 = src.matrixWorld.clone(); const p0 = V(), q0 = new THREE.Quaternion(), s0 = V(); m0.decompose(p0, q0, s0);
        looseObjs.set(c, { obj, p0, q0, s0 });
      } else if (FIXED.has(c.kind) && c.at) { poseAll(c.t); c.atW = resolve(c.at, c.t); }
    }
  }

  // swing trails: where each blade and rod has been over the last few frames (while playing forward)
  const trails = new Map(); let lastT = -1;
  const MELEE = new Set(['blade', 'greatblade', 'rod']);
  function swingTrails(t) {
    const fresh = t < lastT || t - lastT > 0.1; lastT = t;
    for (const v of Object.values(views)) {
      if (v.kind !== 'wanzer') continue;
      for (const slot of ['wL', 'wR']) {
        const w = v.weap[slot]; if (!w || !MELEE.has(w.type)) continue;
        const key = v.A.id + slot; let h = trails.get(key); if (!h || fresh) { h = []; trails.set(key, h); }
        const st = rt.state(v.A.id, t); if (st.gone[slot] || st.hidden || (slot === 'wR' ? st.hp.armR : st.hp.armL) <= 0) { h.length = 0; continue; }
        const tip = v.points['tip' + slot[1]](), base = v.points['hand' + slot[1]]();
        h.push({ t, tip, base }); while (h.length && t - h[0].t > 0.13) h.shift();
        const col = w.type === 'rod' ? [0.45, 0.8, 1] : w.type === 'greatblade' ? [1, 0.55, 0.45] : [1, 0.85, 0.7];
        for (let i = h.length - 1; i > 0; i--) {
          const a = h[i], b = h[i - 1], speed = a.tip.distanceTo(b.tip) / Math.max(1e-3, a.t - b.t); if (speed < 6) continue;
          const age = (t - b.t) / 0.13, k = Math.min(1, (speed - 6) / 10) * (1 - age);
          for (let j = 0; j <= 6; j++) { const q = 0.35 + j * 0.11, p = b.base.clone().lerp(b.tip, q).lerp(a.base.clone().lerp(a.tip, q), 0.5); fx.glow.put(p.x, p.y, p.z, 0.06 + 0.05 * q, ...col, 0.35 * k * q); }
        }
      }
    }
  }

  function render(t, focus) {
    fx.begin();
    swingTrails(t);
    const story = rt.story, SET = story.set || {};
    // the world burning around them
    for (const [i, f] of (SET.fires || []).entries()) fx.fire(t, V(...f.at), f.k ?? 1, 70 + i * 13);
    for (const [i, c] of (SET.columns || []).entries()) fx.column(t, V(...c), 0.7 + 0.15 * (i % 4), 80 + i * 7);
    fx.embers(t, focus, SET.embers ?? 160);
    // eyes, thrusters, the shock rod, the helicopter's wash
    for (const v of Object.values(views)) {
      const s = rt.state(v.A.id, t);
      if (v.kind === 'wanzer') {
        if (!s.dead) { const e = v.points.eye().add(v.m.head.getWorldDirection(V()).multiplyScalar(0.05)), c = new THREE.Color(v.C.eye); // just in front of the face, so the faceplate never hides it
          fx.glow.put(e.x, e.y, e.z, 0.07, c.r, c.g, c.b, 1); fx.glow.put(e.x, e.y, e.z, 0.2, c.r, c.g, c.b, 0.25); }
        if (s.jets > 0.01) { const m = v.m, dir = V(0, -1, -0.55).transformDirection(m.torso.matrixWorld).normalize(); for (const sd of [-1, 1]) fx.jet(t, V(sd * 0.13, 0, -0.42).applyMatrix4(m.torso.matrixWorld), dir, s.jets, v.A.i * 10 + sd); }
        if (s.rod > 0.02 && v.weap.wL?.type === 'rod' && !s.gone.wL) fx.crackle(t, v.points.tipL(), s.rod * (0.55 + 0.45 * Math.abs(Math.sin(t * 13))), 31 + v.A.i);
        for (const [k, st] of v.feet.steps.entries()) if (t >= st.t && t < st.t + 2.4) fx.dust(t, st.t, V(st.x, rt.floor(v.A.id, st.t), st.z), st.land ? 1.2 + 0.6 * (st.k - 1) : 0.22 * st.k, 200 + v.A.i * 300 + k);
      } else if (v.kind === 'heli') {
        const p = rt.pos(v.A.id, t);
        if (p.y < 4.5) for (let k = 0; k < 6; k++) fx.dust(t, Math.floor(t * 2) / 2 - k * 0.5, V(p.x, 0, p.z), 1.4 * (1 - p.y / 4.5), 900 + Math.floor(t * 2) - k);
        const blink = Math.floor(t * 1.5) % 2 === 0;
        if (blink) for (const [x, c] of [[-0.82, [1, 0.2, 0.15]], [0.82, [0.2, 1, 0.4]]]) { const q = V(x, 0.12, 0).applyMatrix4(v.h.body.matrixWorld); fx.glow.put(q.x, q.y, q.z, 0.12, ...c, 0.9); }
        if (s.spot > 0.05) { const q = v.points.spot(); fx.glow.put(q.x, q.y, q.z, 0.35 * s.spot, 1, 0.95, 0.85, 0.9); }
      }
    }
    // the cues
    let mi = { missile: 0, rocket: 0, micro: 0 };
    for (const P of Object.values(pool)) for (const m of P) { m.group.visible = false; m.group.scale.setScalar(1); }
    for (const c of cues) {
      const dt = t - c.t;
      switch (c.kind) {
        case 'shot': {
          if (dt < -0.01 || dt > 1.4) break;
          const from = resolve(c.from, t), to = resolve(c.to, Math.min(t, c.t + c.fly));
          fx.muzzle(t, c.t, from); if (c.big) fx.muzzle(t, c.t + 0.01, from);
          fx.tracer(t, c.t, from, to, c.fly);
          fx.sparks(t, c.t + c.fly, to, null, c.hit ? (c.big ? 1.3 : 0.9) : 0.35, 400 + c.n);
          if (c.big && c.hit) fx.explosion(t, c.t + c.fly, to, 0.22, 450 + c.n);
          if (!c.hit && to.y < 0.5) fx.dust(t, c.t + c.fly, to, c.big ? 0.5 : 0.2, 500 + c.n);
          // a brass case thrown out of the gun, falling
          if (!c.big && c.by && views[c.by]?.points.eject && dt > 0 && dt < 0.9) { const e = views[c.by].points.eject(), d = dt; fx.smoke.put(e.x + 0.6 * d, Math.max(0.03, e.y + 1.2 * d - 4.9 * d * d), e.z + (H(c.n, 9) - 0.5) * d, 0.03, 0.72, 0.55, 0.22, 1); }
          break;
        }
        case 'missile': {
          const T0 = c.t, T1 = c.t1, k = (t - T0) / (T1 - T0); if (k < 0 || !c.fromW) break;
          const a = c.fromW, b = c.toW, mid = a.clone().lerp(b, 0.5), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
          const ctl = mid.add(V(-dz / l * c.side, c.arc, dx / l * c.side));
          // a corkscrew round the flight line, for a swarm (its radius swells and dies away with the flight)
          const ax = b.clone().sub(a).normalize(), e1 = V().crossVectors(ax, V(0, 1, 0)).normalize(), e2 = V().crossVectors(e1, ax), ph = H(c.n, 12) * 6.28;
          const bez = (q) => { const u = 1 - q, p = V(u * u * a.x + 2 * u * q * ctl.x + q * q * b.x, u * u * a.y + 2 * u * q * ctl.y + q * q * b.y, u * u * a.z + 2 * u * q * ctl.z + q * q * b.z); if (c.spiral) { const th = q * c.turns * 6.28 + ph, r = c.spiral * Math.sin(Math.PI * q); p.addScaledVector(e1, Math.cos(th) * r).addScaledVector(e2, Math.sin(th) * r); } return p; };
          if (k < 1) {
            const m = flying(c.model, mi[c.model]++), p = bez(k); m.group.visible = true; m.group.position.copy(p); m.group.lookAt(bez(Math.min(1, k + 0.01))); m.update(t);
            fx.glow.put(p.x, p.y, p.z, c.model === 'micro' ? 0.14 : c.model === 'rocket' ? 0.2 : 0.32, 1, 0.75, 0.4, 0.9); fx.flash(p, c.model === 'missile' ? 4 : 1.5, '#ffa050');
            if (k < 0.06) fx.muzzle(t, T0, a);
          }
          // the smoke trail, thick and twisting, thinning as it ages
          for (let j = 0; j < 46; j++) {
            const q = Math.min(k, 1) - j * 0.022; if (q < 0) break;
            const age = (t - (T0 + q * (T1 - T0))) / (c.model === 'missile' ? 2.6 : c.model === 'micro' ? 1.8 : 1.4); if (age > 1 || age < 0) continue;
            const p = bez(q), w = (H(j + c.n, 3) - 0.5) * 0.25 * age;
            const g = 0.5 + 0.1 * H(j, c.n);
            fx.smoke.put(p.x + age * 0.4 + w, p.y + age * 0.6, p.z + w, c.model === 'missile' ? 0.16 + age * 0.7 : 0.05 + age * 0.3, g, g * 0.97, g * 0.94, (c.model === 'missile' ? 0.55 : 0.4) * (1 - age));
            if (age < 0.05) fx.glow.put(p.x, p.y, p.z, 0.14, 1, 0.6, 0.25, 1 - age / 0.05);
          }
          if (c.boom) fx.explosion(t, T1, b, c.boom, 600 + c.n);
          break;
        }
        case 'explosion': if (c.atW) fx.explosion(t, c.t, c.atW, c.k ?? 1, 700 + Math.round(c.t * 10)); break;
        case 'hit': if (c.atW) { fx.sparks(t, c.t, c.atW, null, 1.4 * (c.k ?? 1), 710 + Math.round(c.t * 10)); if (dt > 0 && dt < 0.12) fx.flash(c.atW, 20 * (1 - dt / 0.12), '#ffd090'); } break;
        case 'ground': if (c.atW) { const g = c.atW.clone(); g.y = 0.05; fx.sparks(t, c.t, g, V(0, 1, 0), 1.0, 730); fx.dust(t, c.t, g, 0.7, 731); } break;
        case 'clash': {
          if (!c.atW) break;
          fx.sparks(t, c.t, c.atW, null, 1.6 * (c.k ?? 1), 740 + Math.round(c.t * 10), [0.75, 0.9, 1]);
          if (dt > 0 && dt < 0.15) fx.flash(c.atW, 50 * (1 - dt / 0.15) * (c.k ?? 1), '#c0e8ff');
          if (c.bind && dt > 0 && dt < c.bind) { const a = resolve(c.a, t), b = resolve(c.b, t), m = a.clone().lerp(b, 0.5); fx.arc(t, a, b, 1.2, 33); fx.arc(t + 0.3, a, b, 0.8, 34); for (let k = 1; k < c.bind / 0.11; k++) fx.sparks(t, c.t + k * 0.11, m, null, 0.45, 760 + k, [0.7, 0.9, 1]); }
          break;
        }
        case 'arc': if (t >= c.t && t <= c.t1) for (let k = 0; k < (c.n || 1); k++) fx.arc(t + k * 0.2, resolve(c.a, t), resolve(c.b, t).add(V((H(k, 1) - 0.5) * (c.spread || 0), (H(k, 2) - 0.5) * (c.spread || 0), 0)), c.k ?? 1.4, 770 + k); break;
        case 'sparks': if (c.every) { if (t >= c.t && t <= c.t1 + 1) for (let k = 0; c.t + k * c.every <= Math.min(t, c.t1); k++) fx.sparks(t, c.t + k * c.every, resolve(c.at, t), c.dir ? V(...c.dir) : null, c.k ?? 0.3, 800 + k + Math.round(c.t)); } else if (c.atW) fx.sparks(t, c.t, c.atW, null, c.k ?? 1, 820 + Math.round(c.t * 10)); break;
        case 'smoke': if (t >= c.t && t <= (c.t1 ?? 99)) { const p = resolve(c.at, t); for (let i = 0; i < 18; i++) { const a = ((t - c.t) / 2.4 + H(i, 760)) % 1; fx.smoke.put(p.x + a * 0.4, p.y + a * 1.4, p.z, 0.12 + a * 0.4, 0.15, 0.14, 0.14, 0.4 * (1 - a)); } } break;
        case 'fire': if (t > c.t && c.atW) fx.fire(t, c.atW, (c.k ?? 1) * S(t, c.t, c.t + 0.9), 810 + Math.round(c.t)); break;
        case 'column': if (t > c.t && c.atW) fx.column(t, c.atW, (c.k ?? 1) * S(t, c.t, c.t + 2), 830 + Math.round(c.t)); break;
        // an escape pod blasting up and away
        case 'pod': {
          if (dt < 0 || dt > 6 || !c.atW) break;
          const m = flying('missile', mi.missile++), d = dt, p = V(c.atW.x + (c.v?.[0] ?? -1) * d, c.atW.y + (c.v?.[1] ?? 6) * d - 0.4 * d * d, c.atW.z + (c.v?.[2] ?? 0.5) * d);
          m.group.visible = true; m.group.position.copy(p); m.group.lookAt(p.clone().add(V(c.v?.[0] ?? -1, (c.v?.[1] ?? 6) - 0.8 * d, c.v?.[2] ?? 0.5))); m.group.scale.setScalar(2.4); m.update(t);
          fx.glow.put(p.x, p.y, p.z, 0.5, 1, 0.8, 0.5, 1); fx.flash(p, 6, '#ffb060');
          for (let j = 1; j < 30; j++) { const e = d - j * 0.05; if (e < 0) break; const q = V(c.atW.x + (c.v?.[0] ?? -1) * e, c.atW.y + (c.v?.[1] ?? 6) * e - 0.4 * e * e, c.atW.z + (c.v?.[2] ?? 0.5) * e); fx.smoke.put(q.x, q.y, q.z, 0.15 + j * 0.03, 0.6, 0.58, 0.56, 0.5 * (1 - j / 30)); }
          break;
        }
        case 'flares': {
          if (dt < 0 || dt > 3 || !c.atW) break;
          for (let i = 0; i < c.n; i++) {
            const d0 = (i % 2) * 0.06 + Math.floor(i / 2) * 0.05, d = dt - d0; if (d < 0) continue;
            const side = i % 2 ? 1 : -1, vx = side * (2.2 + H(i, 1) * 2), vy = 1.5 + H(i, 2) * 2, vz = -1 - H(i, 3) * 2.5, drag = (1 - Math.exp(-d * 1.4)) / 1.4;
            const p = V(c.atW.x + vx * drag, c.atW.y + vy * drag - 1.2 * d * d, c.atW.z + vz * drag), life = 1 - d / 2.8;
            if (life <= 0) continue;
            fx.glow.put(p.x, p.y, p.z, 0.35 * life + 0.1, 1, 0.85, 0.55, life); fx.flash(p, 6 * life, '#ffd090');
            for (let j = 1; j < 8; j++) { const e = Math.max(0, d - j * 0.06), dr = (1 - Math.exp(-e * 1.4)) / 1.4; fx.smoke.put(c.atW.x + vx * dr, c.atW.y + vy * dr - 1.2 * e * e + j * 0.02, c.atW.z + vz * dr, 0.08 + j * 0.05, 0.75, 0.72, 0.7, 0.35 * life * (1 - j / 8)); }
          }
          break;
        }
        case 'loose': {
          const L = looseObjs.get(c); if (!L) break;
          L.obj.visible = dt >= 0 && (c.t1 == null || t < c.t1); if (!L.obj.visible) break;
          const v = c.v || [1.3, 3.4, 1.5], g = 9.8, y0 = L.p0.y, t1 = (v[1] + Math.sqrt(v[1] * v[1] + 2 * g * Math.max(0, y0 - 0.15))) / g;
          let x, y, z, r;
          if (dt < t1) { x = v[0] * dt; y = y0 + v[1] * dt - g * dt * dt / 2; z = v[2] * dt; r = dt * 9; }
          else { const d2 = Math.min(dt - t1, 0.33), v2 = 1.6; x = v[0] * (t1 + 0.3 * d2); y = 0.15 + Math.max(0, v2 * d2 - g * d2 * d2 / 2); z = v[2] * (t1 + 0.3 * d2); r = t1 * 9 + d2 * 3; }
          L.obj.position.set(L.p0.x + x, Math.max(0.12, y), L.p0.z + z);
          L.obj.quaternion.copy(L.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(r, r * 0.6, r * 0.3))); L.obj.scale.copy(L.s0);
          if (dt < 0.8) fx.sparks(t, c.t, L.p0, null, 0.8, 880);
          break;
        }
        default: break;
      }
    }
    return fx.flashes;
  }
  // the screen flashes and the camera shakes the story asks for (and every blast shakes it a little)
  const flashes = cues.filter((c) => c.kind === 'flash').map((c) => [c.t, c.k]);
  const shakes = [...cues.filter((c) => c.kind === 'shake').map((c) => [c.t, c.k, c.dec ?? 5]), ...cues.filter((c) => c.kind === 'explosion' || (c.kind === 'missile' && c.boom)).map((c) => [c.t1 ?? c.t, 0.07 * (c.k ?? c.boom ?? 1), 4])];
  const screen = (t) => { let f = 0, s = 0; for (const [te, k] of flashes) f = Math.max(f, k * imp(t - te, 0.015, 9)); for (const [te, a, d] of shakes) s += a * imp(t - te, 0.02, d); return { flash: f, shake: s }; };
  return { prepare, render, resolve, screen };
}
