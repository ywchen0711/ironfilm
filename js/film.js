// 鋼魂戰線 Iron Front — animated shorts filmed with the Iron Front engine. The player: it loads an episode
// (js/story/<ep>.js, ?ep=ep1 by default), builds the stage and the actors, and every frame asks
//   the runtime (core/runtime.js)   where everyone is and how they stand
//   the actors (core/actors3d.js)   to pose their 3D bodies (the engine's wanzers, the film's own helicopter)
//   the director (core/director.js) for the effects, flashes and shakes
//   the camera (core/camera.js)     for the shot
// Nothing in here belongs to one story.
import * as THREE from '../engine/lib/three.module.min.js';
import { buildSet, FOG, skyAt } from './set.js?v=4';
import { buildProps } from './props.js?v=4';
import { makeClock } from './core/time.js?v=4';
import { EPISODES } from './story/index.js?v=4';
import { FX } from './fx.js?v=4';
import { createRuntime } from './core/runtime.js?v=4';
import { buildActors } from './core/actors3d.js?v=4';
import { createDirector } from './core/director.js?v=4';
import { createCamera } from './core/camera.js?v=4';
import { nameOf } from './cast/characters.js?v=4';
import { seg } from './core/util.js?v=4';
import * as score from './score.js?v=4';

const $ = (id) => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const params = new URLSearchParams(location.search);
const EP = /^[a-z0-9]+$/.test(params.get('ep') || '') ? params.get('ep') : 'ep1';
const story = (await import(`./story/${EP}.js?v=4`)).default, clock = makeClock(story), LEN = clock.filmLen; // LEN: the film's length (slow motion included)
let lang = params.get('lang') === 'en' ? 'en' : (() => { try { return localStorage.getItem('ironfilm.lang') || 'zh'; } catch (e) { return 'zh'; } })();

// ---------------------------------------------------------------- the stage
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const FOG_NEAR = 22, FOG_FAR = 120;
scene.fog = new THREE.Fog(FOG, FOG_NEAR, FOG_FAR);
const camera = new THREE.PerspectiveCamera(40, 2.35, 0.1, 400);
const hemi = new THREE.HemisphereLight('#8a78a8', '#3a2824', 1.7); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffb27a', 3.1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 }); sun.shadow.camera.updateProjectionMatrix();
scene.add(sun); scene.add(sun.target);
const rim = new THREE.DirectionalLight('#6a8ad8', 0.7); rim.position.set(-10, 6, -8); scene.add(rim); // cold light from the dark end of the street
const fireLights = (story.set?.fires || []).map((f) => { const l = new THREE.PointLight('#ff7a30', 6 * (f.k ?? 1), 0, 2); l.position.set(f.at[0], f.at[1] + 0.8, f.at[2]); scene.add(l); return l; });
const fxLights = [0, 1, 2].map(() => { const l = new THREE.PointLight('#ffb060', 0, 0, 2); scene.add(l); return l; });
buildSet(scene);
const props = buildProps(scene, story.set?.props);
const fx = new FX(scene);

// ---------------------------------------------------------------- the story and its actors
const rt = createRuntime(story);
const views = buildActors(scene, rt);
for (const v of Object.values(views)) v.bake(); // footwork and springs, once for the whole film
const director = createDirector({ scene, fx, rt, views });
const cam = createCamera(story, rt, director.resolve);
// what each actor watches: whoever it was told to look at, else whoever it faces
function watched(A, s) {
  const id = s.lookTo || A.face; const v = views[id]; if (!v || rt.state(id, s.t ?? 0).hidden) return null; // nobody watches what is not there
  if (v.kind === 'heli') return v.points.body();
  const p = rt.pos(id, s.t ?? 0); return V(p.x, p.y + 1.25, p.z);
}
const aimOf = (A, t) => { let spec = null; for (const [ta, s] of A.aim || []) if (t >= ta) spec = s; return spec ? director.resolve(spec, t) : null; };
function poseAll(t) {
  for (const v of Object.values(views)) {
    const s = rt.state(v.A.id, t); s.t = t;
    v.pose(t, s, watched(v.A, s), v.kind === 'heli' ? aimOf(v.A, t) : null);
  }
  scene.updateMatrixWorld();
}
director.prepare(poseAll);

// ---------------------------------------------------------------- one frame
let debugCam = null;
function frame(tf) {
  const t = clock.toStory(tf); // everything in the story runs on story time
  // the time of day
  const sky = skyAt(story.set?.sky, t), U = scene.userData.skyU;
  U.sun.value.copy(sky.sun); for (const k of ['top', 'mid', 'hor', 'low', 'glow', 'disc', 'cloud']) U[k].value.copy(sky[k]); U.stars.value = sky.stars;
  sun.color.copy(sky.sunCol); sun.intensity = sky.sunI; hemi.color.copy(sky.hemiSky); hemi.groundColor.copy(sky.hemiGround); hemi.intensity = sky.hemiI; rim.intensity = sky.rimI;
  scene.fog.color.copy(sky.fog); for (const c of [fx.smoke, fx.glow]) c.uni.uFogC.value.copy(sky.fog);
  for (const f of scene.userData.facades) f.emissiveIntensity = sky.windows; scene.userData.lampOn.color.setRGB(sky.lamps, sky.lamps * 0.78, sky.lamps * 0.44);
  for (const p of props) p.update?.(t, sky);
  poseAll(t);
  const c = debugCam ? debugCam(t) : cam.at(t);
  const flashes = director.render(t, c.look);
  // light from the fires and the brightest flashes
  fireLights.forEach((l, i) => { l.intensity = 5 + Math.sin(t * 23 + i) * 1.2 + Math.sin(t * 37 + i) * 0.8; });
  const fl = flashes.slice().sort((a, b) => b.i - a.i);
  fxLights.forEach((l, i) => { const f = fl[i]; if (!f) { l.intensity = 0; return; } l.position.copy(f.p); l.intensity = Math.min(14, f.i * 0.45); l.color.set(f.col); });
  // the camera, shaken by what is going off
  const sc = director.screen(t), sh = sc.shake;
  const sx = (Math.sin(t * 61) + Math.sin(t * 97) * 0.5) * sh, sy = (Math.sin(t * 73 + 1) + Math.sin(t * 89) * 0.5) * sh;
  camera.position.copy(c.pos).add(V(sx * 0.6, sy * 0.6, 0));
  camera.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
  camera.lookAt(c.look.clone().add(V(sx, sy, 0)));
  camera.fov = c.fov; camera.updateProjectionMatrix();
  const focus = c.look.clone(); focus.y = 0;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(sky.sun, 30);
  scene.userData.sky.position.copy(camera.position);
  fx.end(camera, renderer.domElement.height, FOG_NEAR, FOG_FAR);
  renderer.render(scene, camera);
  overlays(t, sc.flash, tf);
}

// ---------------------------------------------------------------- words and fades over the picture
function overlays(t, flash, tf) {
  const SL = story.LEN, fade = Math.max(1 - seg(tf, 0, 0.8), seg(tf, LEN - 0.8, LEN), story.blacks ? Math.max(0, ...story.blacks.map(([a, b]) => Math.min(seg(t, a, a + 0.5), 1 - seg(t, b - 0.5, b)))) : 0);
  $('fade').style.opacity = fade.toFixed(3); $('flash').style.opacity = flash.toFixed(3);
  const tt = story.title[lang], tk = Math.min(seg(t, 0.8, 1.6), 1 - seg(t, 2.8, 3.4));
  $('title').style.opacity = tk.toFixed(3); $('title').innerHTML = `<b>${tt[0]}</b><i>${tt[1]}</i><small>${tt[2]}</small>`;
  const ek = Math.min(seg(t, SL - (story.endFor || 1.7), SL - (story.endFor || 1.7) + 0.7), 1 - seg(t, SL - 0.4, SL));
  $('end').style.opacity = ek.toFixed(3); $('end').innerHTML = `<b>${story.end[lang][0]}</b><small>${story.end[lang][1]}</small>`;
  const L = story.lines[lang].find(([a, b]) => t >= a && t < b), sub = $('sub');
  if (L) { const k = Math.min(seg(t, L[0], L[0] + 0.15), 1 - seg(t, L[1] - 0.15, L[1])); sub.style.opacity = k.toFixed(3); const html = `<span class="who">${nameOf(L[2], lang)}</span>${L[3]}`; if (sub.dataset.html !== html) { sub.innerHTML = html; sub.dataset.html = html; } }
  else sub.style.opacity = '0';
}

// ---------------------------------------------------------------- the frame on the screen: 2.35:1 on wide screens
function layout() {
  const W = window.innerWidth, Hh = window.innerHeight, ar = params.has('thumb') || W / Hh <= 1.3 ? 16 / 9 : 2.35;
  let w = W, h = W / ar; if (h > Hh) { h = Hh; w = h * ar; }
  const f = $('frame'); f.style.width = w + 'px'; f.style.height = h + 'px'; f.style.left = (W - w) / 2 + 'px'; f.style.top = (Hh - h) / 2 + 'px';
  f.style.fontSize = Math.max(11, h / 30) + 'px';
  renderer.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  camera.aspect = w / h;
}
window.addEventListener('resize', () => { layout(); frame(state.t); });

// ---------------------------------------------------------------- the player
const state = { t: Math.max(0, Math.min(LEN, +(params.get('t') || 0))), playing: false, wall: 0, from: 0 };
const UI = {
  zh: { play: '▶ 播放', replay: '↺ 重播', sub: `以《鋼魂戰線》的 3D 引擎拍攝的動畫短片．${Math.floor(LEN / 60)} 分 ${Math.round(LEN % 60)} 秒`, lang: 'EN', hint: '空白鍵 播放／暫停．← → 快轉' },
  en: { play: '▶ Play', replay: '↺ Replay', sub: `An animated short filmed in the Iron Front 3D engine · ${Math.floor(LEN / 60)}:${String(Math.round(LEN % 60)).padStart(2, '0')}`, lang: '中', hint: 'Space play / pause · ← → skip' },
};
function texts() {
  const u = UI[lang]; document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('go').textContent = state.t >= LEN - 0.01 ? u.replay : u.play; $('blurb').textContent = u.sub; $('lang').textContent = u.lang; $('hint').textContent = u.hint;
  $('st').innerHTML = `<b>${story.title[lang][0]}</b><i>${story.title[lang][1]}</i>`;
  $('eps').innerHTML = EPISODES.map((e) => `<a href="?ep=${e.id}${lang === 'en' ? '&lang=en' : ''}" class="${e.id === EP ? 'on' : ''}">${e[lang]}<small>${e.len}</small></a>`).join('');
}
function play() {
  if (state.t >= LEN - 0.01) state.t = 0;
  state.playing = true; state.wall = performance.now(); state.from = state.t; score.play(state.t);
  $('start').hidden = true; $('pp').textContent = '❚❚'; document.body.classList.add('playing');
}
function pause() { state.playing = false; score.stop(); $('pp').textContent = '▶'; document.body.classList.remove('playing'); }
function seek(t) { const was = state.playing; if (was) score.stop(); state.t = Math.max(0, Math.min(LEN, t)); if (was) { state.wall = performance.now(); state.from = state.t; score.play(state.t); } frame(state.t); bar(); }
const mmss = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
function bar() { $('scrub').value = state.t.toFixed(2); $('time').textContent = `${mmss(state.t)} / ${mmss(LEN)}`; }
function loop() {
  if (state.playing) {
    state.t = state.from + (performance.now() - state.wall) / 1000;
    if (state.t >= LEN) { state.t = LEN; pause(); $('start').hidden = false; texts(); }
    frame(state.t); bar();
  }
  requestAnimationFrame(loop);
}
$('scrub').max = String(LEN);
$('go').onclick = play;
$('pp').onclick = () => (state.playing ? pause() : play());
$('scrub').oninput = (e) => seek(+e.target.value);
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('ironfilm.lang', lang); } catch (e) { /* ignore */ } texts(); frame(state.t); };
$('mute').onclick = () => { score.setMuted(!score.isMuted()); $('mute').textContent = score.isMuted() ? '🔇' : '🔊'; };
$('fs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); };
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); state.playing ? pause() : play(); }
  else if (e.code === 'ArrowRight') seek(state.t + 2); else if (e.code === 'ArrowLeft') seek(state.t - 2);
});
// the controls show while the mouse moves
let idle = 0; window.addEventListener('pointermove', () => { document.body.classList.add('awake'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.remove('awake'), 2200); });

score.setSource(`audio/${story.id}.mp3?v=4`);
layout(); texts(); frame(state.t); bar(); loop(); score.load();
$('loading').remove(); $('go').hidden = false;
if (state.t > 0) $('start').hidden = true;
// for tests and screenshots
window.FILM = {
  score, scene, THREE, rt, views, story, LEN, state, clock,
  frame: (t) => { state.t = t; frame(t); bar(); },
  cam: (f) => { debugCam = f ? (t) => { const o = f(t, rt); return { pos: V(...o.pos), look: V(...o.look), fov: o.fov || 35, roll: 0 }; } : null; },
  setLang: (l) => { lang = l; texts(); },
};
