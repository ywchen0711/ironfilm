// Footwork: where each foot is planted, when it lifts, where it lands. The body's path comes from cast.js; the feet
// follow it the way a heavy walker's would: a foot stays where it was put down until the body has moved off it, then
// it steps, landing a little ahead of where the body is going; the two feet take turns; in the air both tuck up and
// land together. Worked out once, at 60 steps a second, for the whole film; pure arithmetic, so the sound tools can
// run it too (tools/cues.mjs).
const ss = (v) => v * v * (3 - 2 * v);
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const bump = (k, a, b) => (k <= a || k >= b ? 0 : Math.sin(((k - a) / (b - a)) * Math.PI));
export const LEG = { thigh: 0.24, shin: 0.32, ankle: 0.08, hipX: 0.15 }; // the wanzer's leg (engine/mech3d.js)
const REACH = LEG.thigh + LEG.shin - 0.006;
const rot = (th, x, z) => ({ x: x * Math.cos(th) + z * Math.sin(th), z: -x * Math.sin(th) + z * Math.cos(th) });

// o: { root(t) -> {x, y, z} (y: the body's height in the world), floor(t), yaw(t), stance(t), crouch(t), skate(t), kx, len }
export function planFeet(o) {
  const HZ = 60, dt = 1 / HZ, N = Math.ceil(o.len * HZ) + 2;
  const kx = o.kx || 1;
  // a foot's place in the body's own frame: in a fighting stance the left foot forward, the right back and turned out
  // kneeling: the left foot well forward, the right knee down with the foot back behind it on its toes
  const kn = (t) => (o.kneel ? o.kneel(t) : 0);
  const off = (side, t) => { const st = o.stance(t), k = kn(t); return { x: side * (LEG.hipX * kx + 0.03 + 0.03 * st), z: side < 0 ? 0.13 * st + 0.16 * k : -0.12 * st - 0.26 * k, yaw: side < 0 ? -0.1 * st : 0.32 * st * (1 - k) }; };
  const want = (side, t) => { const r = o.root(t), th = o.yaw(t), f = off(side, t), p = rot(th, f.x, f.z); return { x: r.x + p.x, z: r.z + p.z, yaw: th + f.yaw }; };
  const vel = (t) => { const a = o.root(Math.max(0, t - 0.02)), b = o.root(t + 0.02); return { x: (b.x - a.x) / 0.04, z: (b.z - a.z) / 0.04 }; };
  const feet = [-1, 1].map((side) => { const w = want(side, 0); return { side, mode: 'plant', x: w.x, z: w.z, yaw: w.yaw, lastEnd: -1 }; });
  const data = feet.map(() => new Float32Array(N * 6)); // x, y, z, yaw, pitch, mode (0 planted, 1 swinging, 2 air, 3 gliding)
  const hip = new Float32Array(N), steps = [];
  let hv = 0, hy = 0.62;
  for (let i = 0; i < N; i++) {
    const t = i * dt, r = o.root(t), fl = o.floor(t), skate = o.skate(t), air = r.y - fl > 0.05 && !skate;
    if (air) for (const f of feet) { f.mode = 'air'; }
    else if (skate) for (const f of feet) { const w = want(f.side, t); Object.assign(f, { mode: 'glide', x: w.x, z: w.z, yaw: w.yaw }); }
    else {
      // touching down after a jump (or the end of a glide): both feet land where they belong
      if (feet.some((f) => f.mode === 'air' || f.mode === 'glide')) {
        const hard = feet.some((f) => f.mode === 'air');
        for (const f of feet) { const w = want(f.side, t); Object.assign(f, { mode: 'plant', x: w.x, z: w.z, yaw: w.yaw, lastEnd: t }); }
        steps.push({ t, k: hard ? 1.4 : 0.7, land: true, x: r.x, z: r.z });
      }
      for (const f of feet) if (f.mode === 'swing' && t >= f.t0 + f.dur) { Object.assign(f, { mode: 'plant', x: f.to.x, z: f.to.z, yaw: f.yaw1, lastEnd: t }); steps.push({ t, k: 0.5 + 0.5 * Math.min(1, f.dist / 0.5), side: f.side, x: f.x, z: f.z }); }
      // the foot that has been left furthest behind steps, if the other one is down
      const err = feet.map((f) => { if (f.mode !== 'plant') return -1; const w = want(f.side, t); let dy = Math.abs(((w.yaw - f.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI); return Math.hypot(w.x - f.x, w.z - f.z) + dy * 0.18; });
      const j = err[0] >= err[1] ? 0 : 1, f = feet[j], other = feet[1 - j], e = err[j];
      const v = vel(t), sp = Math.hypot(v.x, v.z);
      if (e > 0.13 + 0.14 * Math.min(1, sp) && (other.mode === 'plant' || e > 0.45) && t - f.lastEnd > 0.04) {
        const dur = cl(0.4 - 0.05 * sp, 0.26, 0.4);
        const w = want(f.side, t + dur), v2 = vel(t + dur), to = { x: w.x + v2.x * dur * 0.35, z: w.z + v2.z * dur * 0.35 };
        Object.assign(f, { mode: 'swing', t0: t, dur, from: { x: f.x, z: f.z }, to, yaw0: f.yaw, yaw1: w.yaw, dist: Math.hypot(to.x - f.x, to.z - f.z) });
      }
    }
    // record, and how high the hips can ride over the planted feet
    const th = o.yaw(t);
    let hipMax = 9;
    feet.forEach((f, k) => {
      const D = data[k], b = i * 6;
      let x = f.x, z = f.z, y = fl, yaw = f.yaw, pitch = 0, mode = 0;
      if (f.mode === 'swing') {
        const q = cl((t - f.t0) / f.dur), e = ss(q);
        x = f.from.x + (f.to.x - f.from.x) * e; z = f.from.z + (f.to.z - f.from.z) * e; yaw = f.yaw0 + (f.yaw1 - f.yaw0) * e;
        y = fl + (0.04 + 0.22 * Math.min(0.6, f.dist)) * Math.pow(Math.sin(q * Math.PI), 0.8);
        pitch = 0.5 * bump(q, 0, 0.4) - 0.22 * bump(q, 0.45, 0.98); mode = 1; // the heel comes up first; the toe lifts to land
      }
      else if (f.mode === 'air') mode = 2;
      else if (f.mode === 'glide') { y = fl + 0.03; mode = 3; pitch = 0.15; }
      if (f.side > 0 && f.mode === 'plant') pitch = Math.max(pitch, 1.0 * kn(t)); // up on the toes behind a kneel
      D[b] = x; D[b + 1] = y; D[b + 2] = z; D[b + 3] = yaw; D[b + 4] = pitch; D[b + 5] = mode;
      if (mode === 0 || mode === 3) {
        const hp = rot(th, f.side * LEG.hipX * kx, 0), dh = Math.hypot(r.x + hp.x - x, r.z + hp.z - z);
        hipMax = Math.min(hipMax, y + LEG.ankle - r.y + Math.sqrt(Math.max(0, REACH * REACH - dh * dh)));
      }
    });
    // the hips: lowered by the crouch and the stance, held down to what the legs can reach; springy, a little
    const k = kn(t), target = Math.min((0.64 - 0.17 * o.crouch(t) - 0.025 * o.stance(t)) * (1 - k) + 0.31 * k, hipMax);
    if (i === 0) hy = target;
    for (let s = 0; s < 4; s++) { const w = 26, z = 0.8, a = w * w * (target - hy) - 2 * z * w * hv; hv += a * dt / 4; hy += hv * dt / 4; }
    hip[i] = Math.min(hy, hipMax);
  }
  const at = (t) => {
    const u = cl(t * HZ, 0, N - 1.001), i = Math.floor(u), f = u - i;
    const foot = (D) => { const a = i * 6, b = a + 6, m = D[a + 5]; const L = (k) => D[a + k] + (D[b + k] - D[a + k]) * f; return { x: L(0), y: L(1), z: L(2), yaw: L(3), pitch: L(4), mode: m }; };
    return { L: foot(data[0]), R: foot(data[1]), hip: hip[i] + (hip[i + 1] - hip[i]) * f };
  };
  return { at, steps };
}
