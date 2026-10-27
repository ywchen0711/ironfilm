// The camera: a story's shots, each running until the next one starts, cut hard. A shot is
//   { t, pos, look, fov, roll }   pos / look: a point, or [from, to] to move across the shot; fov: a number or [from, to]
//   { t, orbit: { c, r, h, a: [from, to] }, fov }   circling a point at radius r, height h above it
//   { t, vertigo: { at, dir, d: [from, to], h } }   a dolly zoom on `at`: distance d along dir, frame height h kept
//   hand: 1    on any shot: handheld
// Points are what the director understands (js/core/director.js), plus
//   { at: 'ron', off: [x, y, z] }            an actor's place plus an offset
//   { mid: ['ron', 'hound'], off }           halfway between two actors
//   { fixed: 'ron', time: 23.2, off }        where an actor was at a given moment (the camera stays put)
import * as THREE from '../../engine/lib/three.module.min.js';
import { ss, cl } from './util.js?v=4';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function createCamera(story, rt, resolve) {
  const shots = story.shots.map((s, i) => ({ ...s, t1: story.shots[i + 1]?.t ?? story.LEN + 1 }));
  function point(spec, t) {
    if (spec == null) return V();
    if (Array.isArray(spec) || typeof spec === 'string') return resolve(spec, t);
    if (typeof spec.at === 'string') { const p = rt.pos(spec.at, t); return V(p.x, p.y, p.z).add(V(...(spec.off || [0, 0, 0]))); }
    if (spec.mid) { const a = rt.pos(spec.mid[0], t), b = rt.pos(spec.mid[1], t); return V((a.x + b.x) / 2, 0, (a.z + b.z) / 2).add(V(...(spec.off || [0, 0, 0]))); }
    if (spec.fixed) { const p = rt.pos(spec.fixed, spec.time); return V(p.x, p.y, p.z).add(V(...(spec.off || [0, 0, 0]))); }
    return resolve(spec, t);
  }
  const two = (spec) => Array.isArray(spec) && spec.length === 2 && typeof spec[0] !== 'number';
  const along = (spec, t, k) => (two(spec) ? point(spec[0], t).lerp(point(spec[1], t), k) : point(spec, t));
  return {
    shots,
    index: (t) => { const i = shots.findIndex((s) => t >= s.t && t < s.t1); return i < 0 ? shots.length - 1 : i; },
    at(t) {
      const s = shots[this.index(t)], k = ss(cl((t - s.t) / (s.t1 - s.t)));
      let pos, look;
      if (s.vertigo) { // the dolly zoom: the camera pulls back (or in) while the lens narrows to keep the subject the same size
        const v = s.vertigo, c = point(v.at, t), d = v.d[0] + (v.d[1] - v.d[0]) * k, dir = V(...v.dir).normalize();
        return { pos: c.clone().addScaledVector(dir, d), look: c, fov: (2 * Math.atan((v.h || 1.6) / (2 * d)) * 180) / Math.PI, roll: s.roll || 0 };
      }
      if (s.orbit) { const c = point(s.orbit.c, t), a = s.orbit.a[0] + (s.orbit.a[1] - s.orbit.a[0]) * k; pos = c.clone().add(V(Math.cos(a) * s.orbit.r, s.orbit.h, Math.sin(a) * s.orbit.r)); look = c; }
      else { pos = along(s.pos, t, k); look = along(s.look, t, k); }
      const fov = Array.isArray(s.fov) ? s.fov[0] + (s.fov[1] - s.fov[0]) * k : s.fov || 40;
      // handheld: a slow drift and a little tremor, as if someone were holding it
      if (s.hand) { const h = s.hand; pos.add(V(Math.sin(t * 1.3) * 0.6 + Math.sin(t * 3.7) * 0.25, Math.sin(t * 1.7 + 1) * 0.4 + Math.sin(t * 4.3) * 0.2, Math.sin(t * 1.1 + 2) * 0.5).multiplyScalar(h * 0.12)); look.add(V(Math.sin(t * 2.3) * 0.5, Math.sin(t * 2.9 + 1) * 0.4, 0).multiplyScalar(h * 0.1)); }
      return { pos, look, fov, roll: s.roll || 0 };
    },
  };
}
