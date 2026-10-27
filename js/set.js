// The set: one long street through a ruined city at sunset. It runs along x; the sun sets at its +x end.
// Buildings line both sides from z = ±4.8 outwards, with lit windows, broken tops, wrecked cars, street lamps,
// rubble, a sky dome with the sun in it, and dark towers far off in the haze.
import * as THREE from '../engine/lib/three.module.min.js';
import { TOON } from '../engine/world3d.js?v=16';

export const SUN_DIR = new THREE.Vector3(0.86, 0.2, 0.3).normalize();
export const FOG = '#6c4c4e';
export const FIRE_AT = new THREE.Vector3(-10.6, 0.5, -2.3); // a burning wreck behind where they will fight

// the time of day: dusk (the sun low at the +x end), night (a cold moon high up, the windows and the lamps bright),
// dawn (the sun coming up at the -x end). A story names them over time: set.sky = [[t, 'dusk'], [60, 'night'], ...]
export const SKY = {
  dusk: { sun: [0.86, 0.2, 0.3], top: '#121429', mid: '#5c384d', hor: '#eb854d', low: '#4d3333', glow: '#ff8c40', disc: '#ffd9a0', cloud: '#522b33', stars: 0, sunCol: '#ffb27a', sunI: 3.1, hemiSky: '#8a78a8', hemiGround: '#3a2824', hemiI: 1.7, rimI: 0.7, fog: '#6c4c4e', windows: 0.9, lamps: 0.6 },
  night: { sun: [0.3, 0.75, -0.6], top: '#04060e', mid: '#0c1426', hor: '#26304a', low: '#0e1018', glow: '#3a4a7a', disc: '#c8d4ff', cloud: '#141a2a', stars: 1, sunCol: '#7a90d0', sunI: 1.0, hemiSky: '#38406a', hemiGround: '#141418', hemiI: 0.9, rimI: 0.5, fog: '#161c2a', windows: 1.6, lamps: 1 },
  dawn: { sun: [-0.88, 0.16, -0.25], top: '#1a2a4c', mid: '#5a6a8c', hor: '#f0b080', low: '#3a3440', glow: '#ffb070', disc: '#fff0c8', cloud: '#7a6070', stars: 0, sunCol: '#ffd0a0', sunI: 2.6, hemiSky: '#a8b0d0', hemiGround: '#40383a', hemiI: 1.8, rimI: 0.4, fog: '#8a8090', windows: 0.4, lamps: 0.2 },
};
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
// the sky at time t, blended between the story's keys
export function skyAt(keys, t) {
  keys = keys || [[0, 'dusk']];
  let i = 0; while (i < keys.length - 1 && keys[i + 1][0] <= t) i++;
  const a = SKY[keys[i][1]], nb = keys[i + 1], b = nb ? SKY[nb[1]] : a;
  const from = nb ? nb[2] ?? nb[0] - 8 : 0; // a key's third value: when the change towards it begins
  const k = nb ? Math.max(0, Math.min(1, (t - from) / Math.max(0.01, nb[0] - from))) : 0, e = k * k * (3 - 2 * k);
  const out = {};
  for (const key of Object.keys(a)) {
    const va = a[key], vb = b[key];
    if (typeof va === 'number') out[key] = va + (vb - va) * e;
    else if (Array.isArray(va)) out[key] = new THREE.Vector3(...va).lerp(new THREE.Vector3(...vb), e).normalize();
    else out[key] = _c1.set(va).clone().lerp(_c2.set(vb), e);
  }
  return out;
}
// a seeded random, so the city is the same every time
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function canvasTex(w, h, paint, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: TOON, ...o });

// a facade: 8 x 8 window bays over a 4 x 4 unit tile; a few windows still lit
function facade(seed, wall, lit) {
  const R = rng(seed);
  const pal = wall, win = '#16161c', frame = '#2a2624';
  let map, emi;
  const cells = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) cells.push({ x, y, on: R() < lit, broken: R() < 0.18, c: R() });
  map = canvasTex(64, 64, (g) => {
    g.fillStyle = pal[1]; g.fillRect(0, 0, 64, 64);
    for (let k = 0; k < 220; k++) { g.fillStyle = R() < 0.5 ? pal[0] : pal[2]; g.fillRect(Math.floor(R() * 64), Math.floor(R() * 64), 1 + Math.floor(R() * 2), 1); }
    for (let y = 0; y < 8; y++) { g.fillStyle = pal[2]; g.fillRect(0, y * 8, 64, 1); g.fillStyle = pal[0]; g.fillRect(0, y * 8 + 7, 64, 1); }
    for (const c of cells) {
      g.fillStyle = frame; g.fillRect(c.x * 8 + 1, c.y * 8 + 2, 6, 5);
      g.fillStyle = c.on ? '#e8a050' : c.broken ? '#0a0a0c' : win; g.fillRect(c.x * 8 + 2, c.y * 8 + 3, 4, 3);
      if (!c.on && !c.broken && c.c > 0.6) { g.fillStyle = '#3a3a48'; g.fillRect(c.x * 8 + 2, c.y * 8 + 3, 2, 1); } // the sky in the glass
    }
    // soot streaks running up from a few windows
    for (let k = 0; k < 5; k++) { const x = Math.floor(R() * 8) * 8 + 2, y = Math.floor(R() * 8) * 8 + 2; g.fillStyle = 'rgba(10,8,8,0.55)'; g.fillRect(x - 1, Math.max(0, y - 9), 6, 9); }
  });
  emi = canvasTex(64, 64, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); for (const c of cells) if (c.on) { g.fillStyle = c.c > 0.5 ? '#ffb050' : '#d88040'; g.fillRect(c.x * 8 + 2, c.y * 8 + 3, 4, 3); } });
  return toon({ map, emissive: '#ffffff', emissiveMap: emi, emissiveIntensity: 0.9 });
}
const WALLS = [
  ['#3a3230', '#4a403a', '#5a4e46'], ['#2e3034', '#3c3e44', '#4c4e54'], ['#423828', '#544834', '#665a42'],
  ['#34302c', '#46403a', '#58504a'], ['#3a2c2a', '#4c3a36', '#5e4a44'],
];

// scale a box's UVs so the facade tiles every 4 units
function boxUV(geo, w, h, d, du) {
  const uv = geo.attributes.uv, faceW = [d, d, w, w, w, w], faceH = [h, h, d, d, h, h];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * faceW[f] / 4 + du, uv.getY(i) * faceH[f] / 4); }
}

export function buildSet(scene) {
  const R = rng(7);
  const roof = toon({ color: '#2a2422' }), roofD = toon({ color: '#1e1a1a' });
  const facades = []; for (let i = 0; i < 10; i++) facades.push(facade(100 + i, WALLS[i % WALLS.length], i % 3 === 0 ? 0.05 : 0.14));
  const burnt = facade(99, ['#1a1616', '#242020', '#2e2826'], 0.0);
  const add = (geo, mat, x, y, z, ry = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };

  // the sky: a dome, dark blue overhead to orange at the horizon, the sun low in the west
  const U = { sun: { value: SUN_DIR.clone() }, top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, low: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, disc: { value: new THREE.Color() }, stars: { value: 0 }, cloud: { value: new THREE.Color() } };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }',
    fragmentShader: `varying vec3 vD; uniform vec3 sun, top, mid, hor, low, glow, disc, cloud; uniform float stars;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float y = vD.y;
        vec3 c = y > 0.0 ? mix(hor, mid, smoothstep(0.0, 0.22, y)) : mix(hor, low, smoothstep(0.0, -0.15, y));
        c = mix(c, top, smoothstep(0.2, 0.75, y));
        float s = max(0.0, dot(normalize(vD), sun));
        c += glow * pow(s, 8.0) * 0.55 + disc * pow(s, 200.0) * 1.2;
        c = mix(c, disc * 1.1 + vec3(0.1), smoothstep(0.9993, 0.9996, s) * step(0.01, disc.r + disc.g + disc.b)); // the disc
        // a few bands of cloud low over the city
        float band = sin(vD.y * 90.0 + vD.x * 6.0) * 0.5 + 0.5; band = smoothstep(0.75, 1.0, band) * smoothstep(0.02, 0.06, y) * (1.0 - smoothstep(0.12, 0.2, y));
        c = mix(c, cloud, band * 0.6);
        // stars at night
        vec2 g = floor(vec2(atan(vD.z, vD.x) * 120.0, y * 160.0)); float st = step(0.996, h(g)) * smoothstep(0.08, 0.3, y) * stars;
        c += vec3(0.75, 0.8, 1.0) * st;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  scene.userData.sky = sky; scene.userData.skyU = U; scene.userData.facades = facades;

  // the ground: asphalt, sidewalks, kerbs, a dashed centre line
  const asph = canvasTex(64, 64, (g) => { g.fillStyle = '#2a2826'; g.fillRect(0, 0, 64, 64); for (let k = 0; k < 500; k++) { const v = R(); g.fillStyle = v < 0.4 ? '#24221f' : v < 0.8 ? '#312e2a' : '#3a3632'; g.fillRect(Math.floor(R() * 64), Math.floor(R() * 64), 1, 1); } g.fillStyle = '#1c1a18'; let x = 10, y = 20; for (let k = 0; k < 30; k++) { g.fillRect(x, y, 1, 1); x += R() < 0.5 ? 1 : 0; y += R() < 0.7 ? 1 : -1; if (y > 63) y = 0; } });
  asph.repeat.set(30, 2);
  const road = add(new THREE.PlaneGeometry(120, 6.8), toon({ map: asph }), 0, 0, 0, 0, false); road.rotation.x = -Math.PI / 2;
  const conc = canvasTex(32, 32, (g) => { g.fillStyle = '#4a4640'; g.fillRect(0, 0, 32, 32); for (let k = 0; k < 120; k++) { g.fillStyle = R() < 0.5 ? '#423e38' : '#544e48'; g.fillRect(Math.floor(R() * 32), Math.floor(R() * 32), 1, 1); } g.fillStyle = '#34302c'; g.fillRect(0, 31, 32, 1); g.fillRect(31, 0, 1, 32); });
  conc.repeat.set(80, 1);
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(120, 0.12, 1.4), toon({ map: conc }), 0, 0.06, s * 4.1, 0, false);
    add(new THREE.BoxGeometry(120, 0.14, 0.12), toon({ color: '#5a5650' }), 0, 0.07, s * 3.42, 0, false);
  }
  const dash = toon({ color: '#8a7a44' });
  for (let x = -60; x < 60; x += 3) if (R() > 0.15) { const m = add(new THREE.PlaneGeometry(1.3, 0.1), dash, x, 0.005, 0, 0, false); m.rotation.x = -Math.PI / 2; }
  // the street beyond, far off: more ground
  const far = add(new THREE.PlaneGeometry(600, 600), toon({ color: '#241e1c' }), 0, -0.02, 0, 0, false); far.rotation.x = -Math.PI / 2;

  // buildings along both sides
  const building = (x0, w, side, h, ruined) => {
    const d = 4 + R() * 3, mat = ruined && R() < 0.5 ? burnt : facades[Math.floor(R() * facades.length)];
    const geo = new THREE.BoxGeometry(w, h, d); boxUV(geo, w, h, d, Math.floor(R() * 8) / 8);
    const z = side * (4.8 + d / 2);
    add(geo, [mat, mat, roof, roof, mat, mat], x0 + w / 2, h / 2, z);
    // a parapet; or a broken top: a few jagged chunks of wall and a dark hole
    if (!ruined) { add(new THREE.BoxGeometry(w, 0.2, 0.18), roofD, x0 + w / 2, h + 0.1, side * 4.89); if (R() < 0.5) add(new THREE.BoxGeometry(1 + R(), 0.6, 1 + R()), roofD, x0 + w * R(), h + 0.3, z); }
    else {
      for (let k = 0; k < 4; k++) { const cw = w * (0.15 + R() * 0.3), ch = 0.4 + R() * 1.6; const g2 = new THREE.BoxGeometry(cw, ch, 0.35); boxUV(g2, cw, ch, 0.35, R()); add(g2, [mat, mat, roofD, roofD, mat, mat], x0 + R() * (w - cw) + cw / 2, h + ch / 2, side * (4.98 + R() * 0.3)); }
      add(new THREE.BoxGeometry(w * 0.4, h * 0.25, 0.1), toon({ color: '#0c0a0a' }), x0 + w * (0.3 + R() * 0.4), h * (0.6 + R() * 0.25), side * 4.79, 0, false);
    }
    return h;
  };
  for (const side of [-1, 1]) {
    let x = -48;
    while (x < 48) {
      const w = 3 + R() * 3.5;
      let h = 3.5 + R() * 6, ruined = R() < 0.35;
      // the roof the Black Hound waits on
      if (side === 1 && x < 3.5 && x + w > 3.5) { h = 5.0; ruined = false; }
      building(x, w, side, h, ruined);
      x += w + (R() < 0.2 ? 1.2 : 0.05);
    }
  }
  // towers far off in the haze, all round
  const hazeMat = toon({ color: '#3a2a30' });
  for (let k = 0; k < 70; k++) {
    const a = R() * Math.PI * 2, r = 30 + R() * 60, x = Math.cos(a) * r * 1.6, z = Math.sin(a) * r;
    if (Math.abs(z) < 12 && Math.abs(x) < 50) continue;
    const w = 3 + R() * 6, h = 8 + R() * 26;
    add(new THREE.BoxGeometry(w, h, w * (0.6 + R() * 0.8)), hazeMat, x, h / 2, z, R() * 0.5, false);
  }

  // street lamps, one of them bent over
  const pole = toon({ color: '#26262a' }), lampOn = new THREE.MeshBasicMaterial({ color: '#ffc870' }), lampOff = toon({ color: '#3a3a40' }); scene.userData.lampOn = lampOn;
  for (const side of [-1, 1]) for (let x = -44; x < 44; x += 9) {
    const g = new THREE.Group(); g.position.set(x + side * 2, 0.12, side * 4.0); scene.add(g);
    const bent = Math.abs(x + 8) < 2 && side === 1;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.6, 6), pole); p.position.y = 1.3; p.castShadow = true; g.add(p);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.7), pole); arm.position.set(0, 2.58, -side * 0.32); arm.castShadow = true; g.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.26), R() < 0.6 ? lampOn : lampOff); lamp.position.set(0, 2.53, -side * 0.62); g.add(lamp);
    if (bent) g.rotation.x = side * 0.7;
  }
  // wrecked cars: a body, a cabin, wheels; burnt black or rusted
  const carMats = [toon({ color: '#1c1a18' }), toon({ color: '#3a2a22' }), toon({ color: '#2c3034' }), toon({ color: '#4a3424' })], wheel = toon({ color: '#111' });
  const car = (x, z, ry, mi, flip = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.rotation.z = flip; scene.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.46), carMats[mi]); b.position.y = 0.2; b.castShadow = b.receiveShadow = true; g.add(b);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.42), carMats[mi]); c.position.set(-0.05, 0.4, 0); c.castShadow = true; g.add(c);
    for (const [wx, wz] of [[-0.32, 0.24], [0.32, 0.24], [-0.32, -0.24], [0.32, -0.24]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8), wheel); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.09, wz); g.add(w); }
    return g;
  };
  car(FIRE_AT.x, FIRE_AT.z, 0.4, 0); car(6.2, 2.7, -0.2, 1); car(-17, -2.9, 0.1, 2); car(14, -2.6, 2.6, 3, 1.4); car(-24, 2.4, 2.9, 1); car(22, 2.5, 0.3, 0);
  // rubble at the feet of the broken buildings, and a few slabs in the road
  const rub = [toon({ color: '#4a423c' }), toon({ color: '#3a3430' }), toon({ color: '#5a524a' })];
  for (let k = 0; k < 90; k++) {
    const side = R() < 0.5 ? -1 : 1, x = -40 + R() * 80, inRoad = R() < 0.25;
    if (inRoad && x > -9 && x < 6) continue; // keep the fighting ground clear
    const z = inRoad ? (R() - 0.5) * 6 : side * (3.6 + R() * 1.2), s = 0.1 + R() * (inRoad ? 0.35 : 0.5);
    const m = add(new THREE.BoxGeometry(s * (1 + R()), s * 0.6, s), rub[k % 3], x, s * 0.25, z, R() * 3); m.rotation.x = (R() - 0.5) * 0.8;
  }
  // a tank trap and a fallen concrete slab, closer to the camera's first shot
  add(new THREE.BoxGeometry(2.2, 0.35, 1.2), rub[0], -15, 0.15, 1.9, 0.5).rotation.z = 0.12;
  for (const [x, z] of [[-20, -1.5], [-19.3, 1.2], [10, 1.4]]) { const g = new THREE.Group(); g.position.set(x, 0.3, z); scene.add(g); for (const r of [[0, 0, 0.8], [0.8, 0, -0.8], [0, 0.8, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), pole); b.rotation.set(...r); b.castShadow = true; g.add(b); } }
}
