// Effects drawn as soft points (fire, smoke, sparks, dust, glows) and lines (electric arcs).
// Every effect is worked out from the time alone, never simulated step by step, so any frame can be drawn on its own
// and scrubbing back and forth always shows the same thing.
import * as THREE from '../engine/lib/three.module.min.js';

export const H = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const VS = `attribute float size; attribute vec4 col; varying vec4 vC; varying float vF; uniform float uScale; uniform vec2 uFog;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = min(900.0, size * uScale / max(0.05, -mv.z)); vC = col; vF = smoothstep(uFog.x, uFog.y, -mv.z); }`;
const FS = (add) => `varying vec4 vC; varying float vF; uniform vec3 uFogC;
void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; if (d > 1.0) discard;
  float a = ${add ? 'pow(1.0 - d, 1.6)' : 'smoothstep(1.0, 0.25, d)'};
  ${add ? 'gl_FragColor = vec4(vC.rgb * (1.0 - vF), vC.a * a);' : 'gl_FragColor = vec4(mix(vC.rgb, uFogC, vF), vC.a * a);'} }`;

class Cloud {
  constructor(scene, n, add) {
    this.n = n; this.k = 0;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('col', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.uni = { uScale: { value: 300 }, uFog: { value: new THREE.Vector2(25, 120) }, uFogC: { value: new THREE.Color('#6c4c4e') } };
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS(add), uniforms: this.uni, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = add ? 6 : 5; this.geo = g;
    scene.add(this.pts);
  }
  put(x, y, z, s, r, g, b, a) {
    if (this.k >= this.n || a <= 0.003 || s <= 0) return; const i = this.k++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.size[i] = s;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = Math.min(1, a);
  }
  flush() { for (const a of ['position', 'col', 'size']) this.geo.attributes[a].needsUpdate = true; this.geo.setDrawRange(0, this.k); this.k = 0; }
}

export class FX {
  constructor(scene) {
    this.smoke = new Cloud(scene, 9000, false);
    this.glow = new Cloud(scene, 9000, true);
    const n = 6000; this.lpos = new Float32Array(n * 3); this.lcol = new Float32Array(n * 3); this.ln = n; this.lk = 0;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.lpos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(this.lcol, 3).setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.lines.frustumCulled = false; this.lines.renderOrder = 7; scene.add(this.lines);
    this.lgeo = g; this.flashes = [];
  }
  begin() { this.flashes.length = 0; }
  // a light for the strongest flashes this frame
  flash(p, i, col = '#ffb060') { this.flashes.push({ p, i, col }); }
  seg(a, b, r, g, bl) { if (this.lk + 2 > this.ln) return; const i = this.lk; this.lpos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 3); this.lcol.set([r, g, bl, r, g, bl], i * 3); this.lk += 2; }
  end(camera, heightPx, fogNear, fogFar) {
    const s = heightPx / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    for (const c of [this.smoke, this.glow]) { c.uni.uScale.value = s; c.uni.uFog.value.set(fogNear, fogFar); c.flush(); }
    for (const a of ['position', 'color']) this.lgeo.attributes[a].needsUpdate = true; this.lgeo.setDrawRange(0, this.lk); this.lk = 0;
  }

  // ---------------------------------------------------------------- the effects
  // a fireball, a flash, flying sparks, a ring of dust and a column of smoke
  explosion(t, t0, p, k = 1, seed = 1) {
    const dt = t - t0; if (dt < 0 || dt > 5) return;
    if (dt < 0.2) { this.flash(p, 40 * k * (1 - dt / 0.2), '#ffc080'); this.glow.put(p.x, p.y, p.z, 2.6 * k * (1 + dt * 5), 1, 0.85, 0.6, 1 - dt / 0.2); }
    const nf = Math.round(34 * k);
    for (let i = 0; i < nf; i++) {
      const life = 0.45 + 0.5 * H(i, seed), a = dt / life; if (a >= 1) continue;
      const th = H(i, seed + 1) * Math.PI * 2, ph = Math.acos(1 - 2 * H(i, seed + 2) * 0.85), sp = (1.4 + 2.2 * H(i, seed + 3)) * k;
      const r = sp * (1 - Math.exp(-dt * 5)) / 5 * 2.2, dx = Math.sin(ph) * Math.cos(th), dy = Math.abs(Math.cos(ph)) * 0.8 + 0.2, dz = Math.sin(ph) * Math.sin(th);
      const hot = 1 - a;
      this.glow.put(p.x + dx * r, p.y + dy * r + a * 0.4 * k, p.z + dz * r, (0.5 + 0.6 * H(i, seed + 4)) * k * (0.7 + a * 1.1), 1, 0.45 + 0.45 * hot * hot, 0.12 + 0.3 * hot * hot * hot, Math.pow(hot, 1.4) * 0.9);
    }
    const ns = Math.round(26 * k);
    for (let i = 0; i < ns; i++) {
      const d0 = 0.08 + 0.25 * H(i, seed + 5), life = 2.6 + 2 * H(i, seed + 6), a = (dt - d0) / life; if (a < 0 || a >= 1) continue;
      const th = H(i, seed + 7) * Math.PI * 2, rr = 0.9 * k * (1 - Math.exp(-(dt - d0) * 2)) * (0.4 + H(i, seed + 8));
      const g = 0.1 + 0.08 * H(i, seed + 9);
      this.smoke.put(p.x + Math.cos(th) * rr + a * 0.6, p.y + (0.4 + 0.5 * H(i, seed + 10)) * (dt - d0) * k * 1.2 + 0.2, p.z + Math.sin(th) * rr, (0.7 + 0.6 * H(i, seed + 11)) * k * (1 + a * 2.4), g, g * 0.92, g * 0.9, 0.62 * (1 - a) * clamp01((dt - d0) * 5));
    }
    this.sparks(t, t0, p, null, k * 1.2, seed + 20);
    if (p.y < 1.2) this.dust(t, t0, { x: p.x, y: 0.05, z: p.z }, k * 1.4, seed + 30);
  }
  // sparks: hot bits thrown out and falling, each a short streak
  sparks(t, t0, p, dir, k = 1, seed = 2, col = [1, 0.75, 0.35]) {
    const dt = t - t0; if (dt < 0 || dt > 1.2) return;
    if (dt < 0.06) { this.glow.put(p.x, p.y, p.z, 0.5 * k, 1, 0.95, 0.8, 1 - dt / 0.06); this.flash(p, 8 * k, '#ffd090'); }
    const n = Math.round(22 * k);
    for (let i = 0; i < n; i++) {
      const life = 0.25 + 0.45 * H(i, seed), a = dt / life; if (a >= 1) continue;
      let vx = H(i, seed + 1) - 0.5, vy = H(i, seed + 2) * 0.9 + 0.1, vz = H(i, seed + 3) - 0.5;
      if (dir) { vx = vx * 0.7 + dir.x; vy = vy * 0.7 + dir.y; vz = vz * 0.7 + dir.z; }
      const sp = (3 + 4 * H(i, seed + 4)) * Math.sqrt(k);
      for (let j = 0; j < 3; j++) {
        const tt = Math.max(0, dt - j * 0.012);
        const y = Math.max(0.02, p.y + vy * sp * tt - 4.9 * tt * tt);
        this.glow.put(p.x + vx * sp * tt, y, p.z + vz * sp * tt, 0.06 * (1 - j * 0.25), col[0], col[1], col[2], (1 - a) * (1 - j * 0.3));
      }
    }
  }
  // dust kicked up from the ground: a low ring of brown puffs
  dust(t, t0, p, k = 1, seed = 3) {
    const dt = t - t0; if (dt < 0 || dt > 2.4) return;
    const n = Math.round(14 * k);
    for (let i = 0; i < n; i++) {
      const life = 1.2 + 1.0 * H(i, seed), a = dt / life; if (a >= 1) continue;
      const th = (i / n) * Math.PI * 2 + H(i, seed + 1), r = (0.25 + 1.1 * k * (1 - Math.exp(-dt * 3.5))) * (0.6 + 0.4 * H(i, seed + 2));
      this.smoke.put(p.x + Math.cos(th) * r, p.y + 0.12 + dt * 0.25 * H(i, seed + 3), p.z + Math.sin(th) * r, (0.32 + 0.3 * H(i, seed + 4)) * Math.sqrt(k) * (1 + a * 1.8), 0.36, 0.3, 0.25, 0.42 * (1 - a));
    }
  }
  // a gun's flash
  muzzle(t, ts, p) { const dt = t - ts; if (dt < 0 || dt > 0.05) return; const k = 1 - dt / 0.05; this.glow.put(p.x, p.y, p.z, 0.45 * k + 0.1, 1, 0.85, 0.45, k); this.flash(p, 6 * k, '#ffc060'); }
  // a tracer: a bright head and a fading tail, flying from a to b
  tracer(t, ts, a, b, fly) {
    const k = (t - ts) / fly; if (k < 0 || k > 1) return;
    for (let j = 0; j < 7; j++) { const q = Math.max(0, k - j * 0.035); this.glow.put(a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q, a.z + (b.z - a.z) * q, 0.08 - j * 0.008, 1, 0.8, 0.45, 1 - j / 7); }
  }
  // thruster flames from a nozzle, pointing along dir
  jet(t, p, dir, k = 1, seed = 4) {
    if (k <= 0.01) return;
    const f = Math.floor(t * 60);
    for (let j = 0; j < 10; j++) {
      const q = j / 10, l = (0.1 + 0.75 * k) * q, w = H(f + j, seed) * 0.03;
      this.glow.put(p.x + dir.x * l + w, p.y + dir.y * l, p.z + dir.z * l - w, (0.16 - q * 0.12) * (0.6 + 0.6 * k), 0.55 + 0.45 * (1 - q), 0.75 + 0.25 * (1 - q), 1, (1 - q) * 0.85 * Math.min(1, k * 1.5));
    }
    this.flash(p, 3 * k, '#80c0ff');
  }
  // an electric arc between two points, jumping about
  arc(t, a, b, k = 1, seed = 5, col = [0.5, 0.85, 1]) {
    const f = Math.floor(t * 40), n = 7;
    for (let s = 0; s < 2; s++) {
      let prev = a;
      for (let i = 1; i <= n; i++) {
        const q = i / n, j = i === n ? 0 : 0.12 * k;
        const cur = { x: a.x + (b.x - a.x) * q + (H(f + i, seed + s) - 0.5) * j, y: a.y + (b.y - a.y) * q + (H(f + i, seed + s + 9) - 0.5) * j, z: a.z + (b.z - a.z) * q + (H(f + i, seed + s + 17) - 0.5) * j };
        this.seg(prev, cur, col[0] * k, col[1] * k, col[2] * k); prev = cur;
      }
    }
    this.glow.put(b.x, b.y, b.z, 0.22 * k, col[0], col[1], col[2], 0.8);
  }
  // crackling round a point (a shock rod's tip)
  crackle(t, p, k = 1, seed = 6) {
    if (k <= 0.01) return;
    const f = Math.floor(t * 30);
    for (let i = 0; i < 3; i++) { const e = { x: p.x + (H(f, seed + i) - 0.5) * 0.4 * k, y: p.y + (H(f, seed + i + 3) - 0.5) * 0.4 * k, z: p.z + (H(f, seed + i + 6) - 0.5) * 0.4 * k }; this.arc(t, p, e, k * 0.8, seed + i * 11); }
    this.glow.put(p.x, p.y, p.z, 0.25 * k, 0.45, 0.8, 1, 0.9); this.flash(p, 3 * k, '#80d0ff');
  }
  // a fire that burns all the time: flames licking up and smoke rolling off it
  fire(t, p, k = 1, seed = 7) {
    for (let i = 0; i < 26 * k; i++) {
      const life = 0.6 + 0.5 * H(i, seed), a = ((t / life + H(i, seed + 1)) % 1);
      const ox = (H(i, seed + 2) - 0.5) * 0.7 * k, oz = (H(i, seed + 3) - 0.5) * 0.5 * k;
      this.glow.put(p.x + ox * (1 - a * 0.6), p.y + a * 0.9 * k, p.z + oz * (1 - a * 0.6), (0.35 + 0.2 * H(i, seed + 4)) * k * (1 - a * 0.7), 1, 0.4 + 0.4 * (1 - a), 0.1, (1 - a) * 0.75);
    }
    for (let i = 0; i < 22 * k; i++) {
      const life = 4 + 2 * H(i, seed + 5), a = ((t / life + H(i, seed + 6)) % 1);
      this.smoke.put(p.x + (H(i, seed + 7) - 0.5) * 0.5 + a * 1.5, p.y + 0.6 + a * 5 * k, p.z + (H(i, seed + 8) - 0.5) * 0.5 + a * 0.4, (0.4 + a * 1.6) * k, 0.09, 0.08, 0.08, 0.55 * (1 - a) * Math.min(1, a * 8));
    }
    this.flash(p, (5 + Math.sin(t * 23) * 1.2 + Math.sin(t * 37) * 0.8) * k, '#ff8030');
  }
  // a far-off column of smoke rising from the city
  column(t, p, k = 1, seed = 8) {
    for (let i = 0; i < 30; i++) {
      const life = 9 + 4 * H(i, seed), a = ((t / life + H(i, seed + 1)) % 1);
      this.smoke.put(p.x + a * 6 + (H(i, seed + 2) - 0.5) * 2, p.y + a * 22 * k, p.z + (H(i, seed + 3) - 0.5) * 2, (2 + a * 6) * k, 0.12, 0.1, 0.11, 0.6 * (1 - a) * Math.min(1, a * 6));
    }
    this.glow.put(p.x, p.y + 0.5, p.z, 2.5 * k, 1, 0.45, 0.15, 0.5 + 0.1 * Math.sin(t * 9 + seed));
  }
  // embers drifting through the air round a point
  embers(t, c, n = 140, seed = 9) {
    for (let i = 0; i < n; i++) {
      const life = 5 + 4 * H(i, seed), a = ((t / life + H(i, seed + 1)) % 1);
      const x = c.x + (H(i, seed + 2) - 0.5) * 22 + a * 3, y = 0.2 + H(i, seed + 3) * 4 + a * 2.5, z = c.z + (H(i, seed + 4) - 0.5) * 10 + Math.sin(t * 1.3 + i) * 0.3;
      const tw = 0.6 + 0.4 * Math.sin(t * 7 + i * 3);
      this.glow.put(x, y, z, 0.035, 1, 0.55, 0.2, Math.sin(a * Math.PI) * tw);
    }
  }
}
