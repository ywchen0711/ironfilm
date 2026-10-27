// The two machines and everything they do, second by second.
//   Ron (鐵鴉一號): an olive Pallas wanzer, a machine gun in the right hand, a shock rod in the left.
//   The Black Hound (黑犬): a black Kestrel with a combat blade and a missile launcher.
// Each one's place is worked out first (ronPos, houndPos), its pose from that (ronPose, houndPose); nothing is
// simulated, so any second can be drawn by itself.
export const LEN = 30;
const cl = (v) => Math.max(0, Math.min(1, v));
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const ss = (v) => v * v * (3 - 2 * v);
export const S = (t, a, b) => ss(seg(t, a, b));
export const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
export const imp = (dt, rise, decay) => (dt < 0 ? 0 : dt < rise ? dt / rise : Math.exp(-(dt - rise) * decay));
const lerp = (a, b, k) => a + (b - a) * k;

export const RON = { pilot: 'ron', side: 'p', ri: 0, body: 'B1', armL: 'A1', armR: 'A1', legs: 'L1', wL: 'RD1', wR: 'MG1', sh: null, paint: 'olive' };
export const HOUND = { pilot: 'hound', side: 'e', boss: true, x: 3, y: 7, body: 'B4', armL: 'A4', armR: 'A4', legs: 'L4', wL: null, wR: 'W-blade1', sh: 'MS1', paint: 'black' };

// ---------------------------------------------------------------- the beats
export const T = {
  stop: 6.6, land: 7.1, raise: 9.05,
  burst1: 9.5, burst2: 10.9, missile1: 10.6, missile2: 10.78, boom1: 12.25, boom2: 12.45,
  leap: 12.0, leapLand: 12.6, charge: 13.9, clash: 15.4, part: 16.4,
  slash: [17.5, 18.35, 19.2], over: 20.9, counter: 21.5, armOff: 21.6,
  jump: 23.2, strike: 24.6, ronLand: 24.85, boomA: 25.4, boomB: 26.3, fall: 26.35,
};
// the gun: two bursts; the second puts two rounds into the Hound's shoulder
export const SHOTS = [];
for (let k = 0; k < 10; k++) SHOTS.push({ t: T.burst1 + k * 0.08, hit: false, n: k });
for (let k = 0; k < 9; k++) SHOTS.push({ t: T.burst2 + k * 0.08, hit: k === 2 || k === 4, n: 10 + k });

// ---------------------------------------------------------------- where they are
const WALK_V = 1.15, X0 = -13;
const ronX = (t) => {
  if (t < T.stop) return X0 + WALK_V * t;
  const xs = X0 + WALK_V * T.stop; let x = xs + WALK_V * (Math.min(0.8, t - T.stop) - Math.min(0.8, t - T.stop) ** 2 / 1.6);
  x -= 1.6 * S(t, T.leap, T.leapLand); // the jump back from the missiles
  x -= 0.25 * S(t, T.clash, T.clash + 0.25) + 0.15 * S(t, T.clash + 0.25, T.part) + 0.25 * S(t, T.part, T.part + 0.4); // shoved back in the clash
  x -= 0.4 * S(t, T.slash[2], T.slash[2] + 0.6); // the stagger
  x += 0.3 * S(t, 21.15, 21.45); // stepping in for the counter
  x += 0.6 * S(t, T.jump, T.ronLand); // the leap
  return x;
};
const ronZ = (t) => -1.0 * S(t, 9.4, 11.6) + 0.8 * S(t, 13.4, 14.6) + 0.45 * S(t, 20.6, 21.0) - 0.45 * S(t, T.jump, T.ronLand);
const ronY = (t) => 0.55 * bump(t, T.leap, T.leapLand) + 1.55 * Math.sin(Math.PI * seg(t, T.jump, T.ronLand)) ** 0.8 * (t > T.jump && t < T.ronLand ? 1 : 0);
export const ronPos = (t) => ({ x: ronX(t), y: ronY(t), z: ronZ(t) });

// the Hound keeps its distance from Ron in the melee: closing in for each blow and stepping out again
const closeIn = (t, te) => { const dt = t - te, sm = ss; return sm(cl((dt + 0.9) / 0.55)) * (1 - sm(cl((dt - 0.3) / 0.45))); };
export const houndPos = (t) => {
  // on the roof, then the drop into the street
  if (t < 6.3) return { x: 3.5, y: 5.0, z: 5.05 };
  if (t < T.land) { const k = seg(t, 6.3, T.land); return { x: 3.5, y: 5.0 * (1 - k * k) + 0.7 * Math.sin(k * Math.PI), z: lerp(5.05, 0.4, ss(k)) }; }
  let x = 3.5, z = 0.4 + 1.4 * S(t, 9.5, 10.2) - 0.6 * S(t, 11.6, 12.4);
  if (t < T.charge) return { x, y: 0, z };
  // the charge on the jets, straight at Ron
  const end = ronPos(T.clash), k = seg(t, T.charge, T.clash - 0.05), kk = k < 0.3 ? k * k / 0.6 : (k - 0.15) / 0.85;
  if (t < T.clash) return { x: lerp(x, end.x + 1.1, kk), y: 0.06 * bump(t, T.charge, T.clash), z: lerp(z, end.z, kk) };
  // after the clash: always measured from Ron
  const r = ronPos(t);
  let d = 1.1 + 0.5 * S(t, T.part, T.part + 0.5);
  if (t > 17) { d = 1.6; for (const te of [...T.slash, T.over]) d -= 0.55 * closeIn(t, te); }
  d += 0.8 * S(t, 22.0, 22.8) - 0.4 * S(t, 22.8, 23.4);
  return { x: r.x + d, y: 0, z: t > 20 ? -0.2 + 0.2 * S(t, 20.0, 20.6) : r.z };
};

// ---------------------------------------------------------------- how they stand and move
const base = (t) => ({ t, walk: 0, phase: 0, aim: 0, muzzle: false, recoil: 0, stance: 1, sway: Math.sin(t * 1.25) * 0.6, twist: 0.25, lean: 0, guard: 0, crouch: 0.05, roll: 0, kickR: 0, kickL: 0, headKick: 0, armR: null, armL: null, wristL: 0, wristR: 0, look: 0 });
const mix = (a, b, k) => ({ s: a.s + (b.s - a.s) * k, e: a.e + (b.e - a.e) * k });
const REST = { s: -0.5, e: -0.9 };

export function ronPose(t) {
  const p = base(t), out = { pose: p, jets: 0, rod: 0, tilt: 0, faceFixed: 0 };
  // walking down the street, slowing to a stop when the Hound drops in
  if (t < 7.4) {
    p.walk = t < T.stop ? 1 : 1 - S(t, T.stop, 7.4); p.phase = (ronX(t) - X0) * 5.4; p.stance = S(t, 6.9, 7.6); p.sway = 0; p.twist = 0;
    p.headKick = 0.5 * bump(t, 6.0, 7.4); out.faceFixed = 1 - S(t, 6.8, 7.6);
  }
  // the gun comes up
  p.aim = S(t, T.raise, 9.45) * (1 - S(t, 11.85, 12.3));
  if (t > 9.2 && t < 12) {
    for (const s of SHOTS) { const dt = t - s.t; if (dt > -0.01 && dt < 0.04) { p.muzzle = true; p.recoil = 1; } }
    const sw = seg(t, 9.4, 11.6); if (sw > 0 && sw < 1) { p.walk = 0.45; p.phase = t * 9; p.roll = -0.04 * bump(t, 9.4, 11.6); }
  }
  // the leap back from the missiles: crouch, up on the jets, down hard
  p.crouch += 0.45 * bump(t, 11.8, 12.05) + 0.3 * bump(t, T.leap, T.leapLand) + 0.85 * imp(t - T.leapLand, 0.06, 2.6);
  out.jets = Math.max(out.jets, bump(t, T.leap - 0.05, T.leapLand));
  p.lean -= 0.15 * bump(t, T.leap, T.leapLand);
  p.guard = Math.max(p.guard, 0.8 * bump(t, 12.2, 13.6));
  p.headKick += 0.35 * imp(t - T.boom1, 0.05, 4) + 0.25 * imp(t - T.boom2, 0.05, 4);
  // the rod comes alive, and up to meet the charge
  out.rod = S(t, 13.8, 14.4) * (1 - S(t, 27.5, 29));
  const BLOCK = { s: -1.35, e: -1.2 };
  if (t > 14.5 && t < 17.0) {
    const k = S(t, 14.6, 15.25);
    p.armL = mix(REST, BLOCK, k); p.wristL = -0.5 * k; p.guard = 0.5;
    if (t > T.clash) { p.crouch += 0.3; p.lean += 0.12; p.armL.s += Math.sin(t * 60) * 0.02; }
    if (t > T.part) { const q = bump(t, T.part, 16.9); p.armL = mix(BLOCK, { s: -1.6, e: -0.3 }, q); p.lean += 0.15 * q; }
  }
  // parrying two blows, taking the third on the right arm
  if (t >= 17.0 && t < 20.0) {
    const [a, b, c] = T.slash;
    p.armL = { ...BLOCK }; p.wristL = -0.5; p.guard = 0.5;
    const k1 = bump(t, a - 0.45, a + 0.35), k2 = bump(t, b - 0.45, b + 0.35);
    p.armL = mix(p.armL, { s: -1.5, e: -1.4 }, k1); p.twist += 0.3 * k1;
    p.armL = mix(p.armL, { s: -2.6, e: -0.7 }, k2); p.crouch += 0.25 * k2;
    const h = imp(t - c, 0.06, 3);
    p.kickR += 1.1 * h; p.twist += 0.5 * h; p.roll += 0.1 * h; p.headKick += 0.4 * h; p.lean -= 0.2 * h;
    if (t > c + 0.06 && t < c + 0.6) { p.walk = 0.45; p.phase = -(t - c) * 10; }
  }
  // dodging the overhead blow, then the uppercut into the Hound's sword arm
  if (t >= 20.0 && t < 23.2) {
    p.armL = { ...REST }; p.guard = 0.4;
    const d = bump(t, 20.55, 21.2); p.crouch += 0.5 * d; p.roll += 0.12 * d; if (seg(t, 20.6, 21.0) % 1) { p.walk = 0.45; p.phase = t * 11; }
    const wu = S(t, 21.1, 21.38), st = S(t, 21.38, 21.5), back = 1 - S(t, 21.8, 22.3);
    p.armL = mix(mix(REST, { s: 0.35, e: -0.5 }, wu), { s: -2.5, e: -0.45 }, st); p.armL = mix(REST, p.armL, back);
    p.wristL = -0.8 * st * back; p.crouch += 0.6 * wu * (1 - st); p.lean -= 0.15 * st * back;
    p.crouch += 0.8 * bump(t, 22.7, 23.25); p.armL = mix(p.armL, { s: 0.3, e: -0.4 }, S(t, 22.7, 23.1));
  }
  // the leap and the blow coming down
  if (t >= 23.2 && t < 26.5) {
    p.crouch += 0.3 * bump(t, T.jump, T.ronLand) + 0.9 * imp(t - T.ronLand, 0.06, 1.2);
    out.jets = Math.max(out.jets, 1.2 * bump(t, T.jump - 0.05, 23.9) + 0.3 * bump(t, 23.9, 24.6));
    const up = S(t, T.jump, 23.6), down = S(t, 24.38, T.strike);
    p.armL = mix(mix({ s: 0.3, e: -0.4 }, { s: -2.95, e: -0.45 }, up), { s: -0.75, e: -0.2 }, down);
    p.wristL = -0.4 * up; p.lean += 0.28 * down - 0.1 * up * (1 - down); p.guard = 0.3;
    p.headKick -= 0.25 * down;
    if (t > 25) p.armL = mix(p.armL, REST, S(t, 25.6, 26.5));
  }
  // standing in the smoke at the end
  if (t >= 26.5) { p.armL = mix({ s: -0.75, e: -0.2 }, REST, S(t, 26.5, 27.3)); p.crouch += 0.35 * (1 - S(t, 26.5, 27.8)); p.guard = 0; p.twist = 0.15; p.look = -0.35 * S(t, 28.2, 29.2); }
  p.crouch = Math.min(1, p.crouch);
  return out;
}

export function houndPose(t) {
  const p = base(t), out = { pose: p, jets: 0, tilt: 0, sink: 0, armOff: t >= T.armOff, dead: t >= T.boomB, hp: null };
  p.sway = Math.sin(t * 1.1 + 2) * 0.7; p.twist = 0.32;
  // up on the roof, looking down; the drop; the landing
  if (t < T.land) { p.crouch = t < 6.3 ? 0.2 + 0.3 * S(t, 5.9, 6.3) : 0.35; p.lean = 0.12; p.headKick = -0.25; p.armR = t < 6.3 ? { s: -0.2, e: -0.4 } : { s: 0.4, e: -0.3 }; out.jets = bump(t, 6.2, T.land + 0.1) * 1.1; }
  else { const k = imp(t - T.land, 0.05, 2.2); p.crouch += 0.95 * k; p.lean += 0.3 * k; p.armR = mix({ s: -0.6, e: -0.5 }, { s: -0.15, e: -0.2 }, k); p.wristR = 0.3; }
  // the taunt: the head tilts
  p.headKick += 0.2 * bump(t, 7.8, 9.0); p.roll += 0.08 * bump(t, 7.8, 9.0);
  // sliding sideways on the jets out of the line of fire; the missiles; two rounds in the shoulder
  const d = bump(t, 9.45, 10.3); p.crouch += 0.5 * d; p.lean += 0.15 * d; p.roll -= 0.15 * d; out.jets = Math.max(out.jets, d);
  for (const tm of [T.missile1, T.missile2]) { const k = imp(t - tm, 0.04, 6); p.lean -= 0.12 * k; p.headKick += 0.1 * k; }
  for (const s of SHOTS) if (s.hit) { const k = imp(t - (s.t + 0.2), 0.05, 5); p.kickL += 0.5 * k; p.twist -= 0.25 * k; p.roll -= 0.05 * k; }
  // the charge
  if (t >= 12.4 && t < T.clash) {
    p.crouch += 0.55 * S(t, 13.0, T.charge); p.lean += 0.3 * S(t, 13.0, T.charge);
    if (t > T.charge) { p.walk = 0; out.jets = 1.3; p.armR = { s: 0.6, e: -0.3 }; p.wristR = 0.4; }
    const wu = S(t, 15.0, 15.22), st = S(t, 15.22, T.clash);
    if (t > 15.0) { p.twist = 0.3 + 0.7 * wu - 1.3 * st; p.armR = mix(mix({ s: 0.6, e: -0.3 }, { s: -1.45, e: -0.25 }, wu), { s: -1.45, e: -0.15 }, st); p.wristR = 1.2 * Math.max(wu, st); }
  }
  // locked blade to rod, then thrown apart
  if (t >= T.clash && t < 17.0) {
    out.jets = 0.6 * (1 - S(t, T.clash, 15.9));
    p.armR = { s: -1.45 + Math.sin(t * 55) * 0.02, e: -0.2 }; p.wristR = 1.1; p.twist = -0.35; p.lean += 0.25; p.crouch += 0.3;
    const q = bump(t, T.part, 17.0); p.lean -= 0.4 * q; p.crouch += 0.2 * q; if (q > 0.05) { p.walk = 0.45; p.phase = -t * 12; }
  }
  // three blows: across, overhead, a thrust; then the big overhead that misses
  if (t >= 17.0 && t < 21.4) {
    p.armR = { ...REST };
    const styles = { [T.slash[0]]: 'side', [T.slash[1]]: 'over', [T.slash[2]]: 'thrust', [T.over]: 'over' };
    for (const te of [...T.slash, T.over]) {
      const dt = t - te; if (dt < -0.9 || dt > 0.75) continue;
      const c = closeIn(t, te); if (c > 0.02 && c < 0.98 && dt < 0.3) { p.walk = Math.max(p.walk, 0.7); p.phase = t * 14; }
      if (dt < 0.3 && dt > -0.9 && c > 0.98) p.walk = 0;
      const wu = cl((dt + 0.32) / 0.24), st = cl((dt + 0.07) / 0.09), back = 1 - ss(cl((dt - 0.3) / 0.45));
      const pose2 = (bk, hit) => mix(REST, st > 0 ? mix(bk, hit, st) : mix(REST, bk, wu), back);
      const sty = styles[te];
      if (sty === 'side') { p.twist = (st > 0 ? 1.0 - 1.9 * st : 0.3 + 0.7 * wu) * back + 0.32 * (1 - back); p.armR = pose2({ s: -1.45, e: -0.25 }, { s: -1.45, e: -0.15 }); p.wristR = 1.2 * wu * back; }
      else if (sty === 'thrust') { p.twist = (st > 0 ? 0.45 - 0.7 * st : 0.3 + 0.15 * wu); p.armR = pose2({ s: -0.15, e: -1.9 }, { s: -1.6, e: 0 }); p.lean += 0.15 * st * back; p.wristR = 1.5 * Math.max(wu, st) * back; }
      else { p.armR = pose2({ s: -2.8, e: -0.3 }, { s: te === T.over ? -0.25 : -0.6, e: -0.2 }); p.lean += (te === T.over ? 0.35 : 0.1) * st * back; p.crouch += (te === T.over ? 0.35 : 0) * st * back; }
    }
  }
  // the uppercut takes the sword arm off; staggering back, sparking
  const h = imp(t - T.counter, 0.05, 2.5);
  p.kickR += 1.4 * h; p.twist += 0.6 * h; p.headKick += 0.5 * h; p.roll -= 0.15 * h; p.lean -= 0.25 * h;
  if (t > 22.0 && t < 22.8) { p.walk = 0.55; p.phase = -t * 11; }
  if (t > 21.6 && t < T.strike) { p.guard = 0.8 * S(t, 22.4, 23.0); p.sway *= 1.6; p.crouch += 0.12; p.armL = mix({ s: -0.3, e: -0.6 }, { s: -1.5, e: -1.5 }, S(t, 23.6, 24.3)); }
  // the blow from above: down on its knees, and over backwards when it blows up
  if (t >= T.strike) {
    const k = imp(t - T.strike, 0.04, 2.5);
    p.headKick += 1.0 * k; p.lean -= 0.5 * k; p.guard = 0; p.armL = { s: -0.25, e: -0.3 };
    p.crouch = Math.min(1, 0.4 * k + S(t, 24.7, 25.7)); out.sink = 0.14 * S(t, 24.7, 25.7);
    p.headKick += 0.35 * imp(t - T.boomA, 0.04, 3); p.roll += 0.1 * imp(t - T.boomA, 0.04, 3);
    out.tilt = -0.18 * S(t, 24.8, 25.7) - 1.2 * S(t, T.fall, T.fall + 0.75) ** 1.6;
    out.sink += 0.2 * S(t, T.fall, T.fall + 0.75);
    p.stance = 1 - S(t, T.fall, T.fall + 0.4);
  }
  p.crouch = Math.min(1, p.crouch);
  return out;
}

// ---------------------------------------------------------------- the words on screen
export const LINES = {
  zh: [
    [4.0, 6.0, '指揮部', '鐵鴉一號，停火線就在兩公里外。走過去，戰爭就結束了。'],
    [6.5, 8.0, '黑犬', '結束？戰爭從來不會結束，洛恩。'],
    [8.15, 9.3, '洛恩', '那今晚，就由我來結束它。'],
    [16.0, 17.0, '黑犬', '你還是一樣天真！'],
    [22.6, 23.6, '洛恩', '……到此為止了。'],
  ],
  en: [
    [4.0, 6.0, 'HQ', 'Raven One, the ceasefire line is two clicks out. Walk across and the war is over.'],
    [6.5, 8.0, 'Black Hound', 'Over? Wars never end, Ron.'],
    [8.15, 9.3, 'Ron', 'Then tonight I end this one.'],
    [16.0, 17.0, 'Black Hound', 'Still the same fool!'],
    [22.6, 23.6, 'Ron', '...It ends here.'],
  ],
};
export const TITLE = { zh: ['鋼魂戰線', '鐵鴉之夜', '2097．艾瑞斯島．停戰前夜'], en: ['IRON FRONT', 'Night of the Ravens', '2097 · Ares Island · The night before the truce'] };
export const END = { zh: ['鋼魂戰線　鐵鴉之夜', '第一幕　完'], en: ['IRON FRONT — Night of the Ravens', 'End of Act One'] };
