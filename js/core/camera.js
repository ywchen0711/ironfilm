// The camera: a story's shots, each running until the next one starts, cut hard. A shot is
//   { t, pos, look, fov, roll }   pos / look: a point, or [from, to] to move across the shot; fov: a number or [from, to]
//   { t, orbit: { c, r, h, a: [from, to] }, fov }   circling a point at radius r, height h above it
// Points are what the director understands (js/core/director.js), plus
//   { at: 'ron', off: [x, y, z] }            an actor's place plus an offset
//   { mid: ['ron', 'hound'], off }           halfway between two actors
//   { fixed: 'ron', time: 23.2, off }        where an actor was at a given moment (the camera stays put)
import * as THREE from '../../engine/lib/three.module.min.js';
import { ss, cl } from './util.js?v=3';

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
      if (s.orbit) { const c = point(s.orbit.c, t), a = s.orbit.a[0] + (s.orbit.a[1] - s.orbit.a[0]) * k; pos = c.clone().add(V(Math.cos(a) * s.orbit.r, s.orbit.h, Math.sin(a) * s.orbit.r)); look = c; }
      else { pos = along(s.pos, t, k); look = along(s.look, t, k); }
      const fov = Array.isArray(s.fov) ? s.fov[0] + (s.fov[1] - s.fov[0]) * k : s.fov || 40;
      return { pos, look, fov, roll: s.roll || 0 };
    },
  };
}
