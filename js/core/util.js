// Small shared helpers: easing, impulses, a seeded hash. Pure arithmetic, used in the browser and by the sound tools.
export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const ss = (v) => v * v * (3 - 2 * v);
export const S = (t, a, b) => ss(seg(t, a, b));
export const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
export const imp = (dt, rise, decay) => (dt < 0 ? 0 : dt < rise ? dt / rise : Math.exp(-(dt - rise) * decay));
export const lerp = (a, b, k) => a + (b - a) * k;
export const H = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// a curve shape over [t0, t1]: 'in' ramps up and holds, 'out' holds and ramps down, 'hold' ramps both ends, 'bump' rises and falls
export function shape(t, t0, t1, kind = 'hold', ramp = 0.25) {
  if (kind === 'bump') return bump(t, t0, t1);
  if (kind === 'in') return S(t, t0, t1);
  if (kind === 'out') return 1 - S(t, t0, t1);
  if (kind === 'imp') return imp(t - t0, ramp, (t1 - t0) > 0 ? 3 / (t1 - t0) : 3);
  const r = Math.min(ramp, (t1 - t0) / 2); return Math.min(S(t, t0, t0 + r), 1 - S(t, t1 - r, t1));
}
// ease for moves: 'ss' smooth, 'in' accelerating, 'out' braking, 'lin'
export function ease(k, kind = 'ss') { k = cl(k); return kind === 'lin' ? k : kind === 'in' ? k * k : kind === 'out' ? 1 - (1 - k) * (1 - k) : ss(k); }
// a smooth path through timed keys [[t, x, y, z], ...] (Catmull-Rom)
export function spline(keys, t) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
  const n = keys.length; if (t >= keys[n - 1][0]) return { x: keys[n - 1][1], y: keys[n - 1][2], z: keys[n - 1][3] };
  let i = 0; while (keys[i + 1][0] < t) i++;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n - 1, i + 2)], u = (t - p1[0]) / (p2[0] - p1[0]);
  const c = (k) => { const a = p0[k], b = p1[k], d = p2[k], e = p3[k]; return 0.5 * (2 * b + (-a + d) * u + (2 * a - 5 * b + 4 * d - e) * u * u + (-a + 3 * b - 3 * d + e) * u * u * u); };
  return { x: c(1), y: c(2), z: c(3) };
}
