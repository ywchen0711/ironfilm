"""The soundtrack of an episode: real recordings and a real orchestra, mixed to the episode's own cues.

    node tools/cues.mjs ep1 > tools/cues.json              # every cue, step, thruster burn and flight path, from the story
    python tools/voices.py cues.json                       # the spoken lines, both languages (tools/voices_ep1.json)
    python -P tools/mix.py RAW KN FIRE VSCO HELI [cues.json] # -> audio/ep1.zh.mp3 and audio/ep1.en.mp3

Nothing here belongs to one story: each kind of cue has its sound (SOUNDS below), the music is played from the
episode's cue sheet (story.music), the helicopter's rotor follows its flight.

RAW   Kenney's Impact Sounds and Sci-fi Sounds, unzipped flat (CC0, kenney.nl)
KN    Kaiju Night's designed effects (github.com/ywchen0711/kaiju-night, sfx/; CC0, built from CC0 recordings)
FIRE  The Free Firearm Sound Library, "Prepared SFX Library" (CC0, opengameart.org/content/the-free-firearm-sound-library)
VSCO  Versilian Studios Chamber Orchestra 2 Community Edition (CC0, github.com/sgossner/VSCO-2-CE)
HELI  helicopter_0.mp3 (aquinn, opengameart.org/content/helicopter-sounds) and heli_0.ogg (WuxiaScrub,
      opengameart.org/node/131039), both CC0
Needs numpy, scipy, soundfile and ffmpeg.
"""
import glob, json, os, re, subprocess, sys
from math import gcd
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
RAW, KN, FIRE, VSCO, HELI = sys.argv[1:6]
HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, sys.argv[6] if len(sys.argv) > 6 else 'cues_ep1.json'), encoding='utf-8'))
LEN, EP = CUE['LEN'], CUE['ep']
FILM = CUE.get('filmLen', LEN)
rng = np.random.default_rng(7)
N = int((FILM + 1.5) * SR)
# slow motion: everything is cued in story time; it is placed in film time, and sounds inside a slowed stretch are
# played slower and lower, as a slowed recording would be
WARP = CUE.get('warp', [])
def to_film(tw):
    f = w = 0.0
    for a, b, r, *_ in WARP:
        if tw <= a: return f + (tw - w)
        f += a - w; w = a
        if tw <= b: return f + (tw - a) / r
        f += (b - a) / r; w = b
    return f + (tw - w)
def rate_at(tw):  # slow motion only: a hit-stop ('stop') freezes the picture, not the sound
    for a, b, r, *flag in WARP:
        if a <= tw < b and not flag: return r
    return 1.0

# ---------------------------------------------------------------- loading and shaping
_cache = {}
def load(path):
    """a recording as 48 kHz stereo, every one at the same peak so the gains below mean something"""
    if path in _cache: return _cache[path]
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    if x.shape[1] == 1: x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR: g = gcd(SR, sr); x = resample_poly(x, SR // g, sr // g, axis=0).astype(np.float32)
    x = x / max(1e-6, float(np.abs(x).max())) * 0.9
    _cache[path] = x; return x
def pitch(x, semis):
    """varispeed: pitch and length change together, like a tape slowed down"""
    if abs(semis) < 0.01: return x
    return resample_poly(x, 1000, int(round(1000 * 2 ** (semis / 12))), axis=0).astype(np.float32)
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x, axis=0).astype(np.float32)
def fade(x, a=0.002, b=0.05):
    x = x.copy(); n = len(x); na, nb = min(n, int(a * SR)), min(n, int(b * SR))
    if na: x[:na] *= np.linspace(0, 1, na)[:, None]
    if nb: x[-nb:] *= np.linspace(1, 0, nb)[:, None]
    return x
def cut(x, t0, t1): return x[int(t0 * SR):int(t1 * SR)]
def loop(x, secs): return np.tile(x, (int(secs / (len(x) / SR)) + 2, 1))[:int(secs * SR)]
def db(v): return 10 ** (v / 20)
def pan(x, p): a = (p + 1) * np.pi / 4; return x * np.array([np.cos(a), np.sin(a)], dtype=np.float32) * 1.414

BUS = {k: np.zeros((N, 2), np.float32) for k in ('sfx', 'verb', 'music', 'amb')}
def put(bus, x, t, g=1.0, p=0.0, verb=0.25):
    r = rate_at(t)
    if r < 1 and len(x): x = pitch(x, 12 * np.log2(r) * 0.5)
    i = int(to_film(t) * SR)
    if i >= N or len(x) == 0: return
    if i < 0: x = x[-i:]; i = 0
    x = pan(x, p) * g; n = min(len(x), N - i)
    BUS[bus][i:i + n] += x[:n]
    if verb and bus != 'verb': BUS['verb'][i:i + n] += x[:n] * verb
def pick(pattern):
    fs = sorted(glob.glob(pattern)); assert fs, pattern
    return fs[int(rng.integers(len(fs)))]
def K(name): return load(pick(os.path.join(RAW, name + '*')))
def KNs(name): return load(pick(os.path.join(KN, name + '*.mp3')))

# ---------------------------------------------------------------- the sounds, by kind of cue
def step(t, k, land=False, loud=1.0):
    g = loud * (0.5 + 0.3 * min(1.4, k))
    if land:
        put('sfx', filt(pitch(K('impactPunch_heavy'), -12), 'lowpass', 900), t, 0.55 * g)
        put('sfx', pitch(K('impactMetal_heavy'), -9), t, 0.3 * g)
        put('sfx', filt(pitch(K('lowFrequency_explosion'), -4), 'lowpass', 400), t, 0.35 * g, verb=0.4)
        put('sfx', pitch(K('impactMining'), -5), t + 0.02, 0.18 * g)
        put('sfx', KNs('servo'), t + 0.12, 0.08 * g)
    else:
        put('sfx', filt(pitch(K('footstep_concrete'), -7), 'lowpass', 2500), t, 0.16 * g)
        put('sfx', filt(pitch(K('impactPunch_heavy'), -10), 'lowpass', 700), t, 0.16 * g)
        put('sfx', pitch(K('impactMetal_medium'), -8 + rng.uniform(-1, 1)), t + 0.01, 0.05 * g)

def jet(t0, t1, g=1.0, p=0.0):
    d = t1 - t0; x = filt(pitch(loop(K('thrusterFire'), d + 0.4), -3), 'lowpass', 5000)
    i = np.arange(len(x)); env = np.minimum(1, np.minimum(i / (0.06 * SR), (len(x) - i) / (0.35 * SR)))[:, None]
    put('sfx', x * env, t0, 0.3 * g, p, verb=0.3)
    put('sfx', fade(cut(filt(pitch(K('spaceEngineLarge'), -5), 'lowpass', 1500), 0, d + 0.3), 0.05, 0.3), t0, 0.16 * g, p)

def explosion(t, k=1.0, p=0.0):
    put('sfx', pitch(KNs('explosion'), rng.uniform(-2, 0)), t, 0.8 * k, p, verb=0.5)
    put('sfx', pitch(K('explosionCrunch'), -6), t, 0.45 * k, p, verb=0.5)
    put('sfx', filt(pitch(K('lowFrequency_explosion'), -2), 'lowpass', 300), t, 0.8 * k, p, verb=0.2)
    for _ in range(int(3 * k) + 1): put('sfx', pitch(K('impactMining'), rng.uniform(-6, 0)), t + 0.25 + rng.uniform(0, 0.9), 0.12 * k, rng.uniform(-0.8, 0.8))
    if k > 0.9: put('sfx', pitch(K('impactGlass_heavy'), -3), t + 0.35, 0.18 * k, rng.uniform(-0.8, 0.8), verb=0.6)

def ak_shots():
    """single shots cut from a real AK-47 recording"""
    x = load(os.path.join(FIRE, 'AK-47', 'C_28P.wav'))
    env = np.convolve(np.abs(x).max(axis=1), np.ones(96) / 96, mode='same'); thr = env.max() * 0.25; on = []; i = 0
    while i < len(env):
        if env[i] > thr: on.append(i); i += int(0.35 * SR)
        else: i += 1
    return [fade(x[max(0, o - int(0.004 * SR)): o + int(0.8 * SR)], 0.001, 0.3) for o in on] or [x[:int(0.8 * SR)]]
SHOT = ak_shots()
def gunshot(t, j, hit, big=False, p=0.0, fly=0.2):
    s = SHOT[j % len(SHOT)]
    if big:  # a helicopter's cannon: deeper, with a thump; each round bursts where it lands
        put('sfx', pitch(s, -6 + rng.uniform(-0.4, 0.4)), t, 0.6, p, verb=0.5)
        put('sfx', filt(pitch(K('impactPunch_heavy'), -16), 'lowpass', 400), t, 0.35, p, verb=0.2)
        put('sfx', pitch(K('explosionCrunch'), rng.uniform(-2, 2)), t + fly, 0.22 if hit else 0.14, -p, verb=0.4)
    else:
        put('sfx', pitch(s, -2.5 + rng.uniform(-0.4, 0.4)), t, 0.75, p, verb=0.35)
        put('sfx', filt(pitch(K('impactPunch_heavy'), -14), 'lowpass', 500), t, 0.25, p, verb=0)
        if j % 2 == 0: put('sfx', pitch(K('impactMetal_light'), 7), t + 0.25 + rng.uniform(0, 0.2), 0.06, p + 0.3)  # the brass falling
    if hit: put('sfx', pitch(K('impactMetal_heavy'), rng.uniform(-3, 0)), t + fly, 0.32, -p, verb=0.3)
    else: put('sfx', pitch(K(rng.choice(['impactPlate_light', 'impactMining', 'impactGlass_light'])), rng.uniform(-2, 3)), t + fly + rng.uniform(0, 0.05), 0.07, -p * 0.5 + rng.uniform(-0.5, 0.5), verb=0.5)

def missile(t0, t1, model='missile', boom=1.0, p=0.0):
    small = model == 'rocket'
    put('sfx', filt(pitch(K('impactPunch_heavy'), -9 if not small else -4), 'lowpass', 1200), t0, 0.45 if not small else 0.25, p)
    put('sfx', pitch(K('laserLarge'), -10 if not small else -4), t0, 0.22 if not small else 0.12, p, verb=0.4)
    put('sfx', fade(cut(pitch(KNs('thrust'), 2 if not small else 5), 0, t1 - t0 + 0.1), 0.01, 0.15), t0, 0.45 if not small else 0.22, p, verb=0.3)
    if not small: jet(t0, t1, 0.5, p)
    if boom: explosion(t1, boom, -p)

def zap(t, k=1.0): put('sfx', pitch(KNs('plasma'), rng.uniform(-1, 2)), t, 0.22 * k, rng.uniform(-0.3, 0.3), verb=0.3)
def clash(t, k=1.0, bind=0):
    k *= 1.3
    put('sfx', pitch(KNs('metal_h'), 3), t, 0.6 * k, 0, verb=0.5)
    put('sfx', pitch(K('impactBell_heavy'), -5), t, 0.25 * k, 0, verb=0.6)
    put('sfx', pitch(K('impactMetal_heavy'), -2), t, 0.35 * k)
    put('sfx', KNs('bolt'), t, 0.22 * k, 0, verb=0.4)
    for j in range(int(bind / 0.11)): put('sfx', pitch(K('impactPlate_medium'), rng.uniform(-6, -2)), t + 0.12 + j * 0.11, 0.08)  # grinding
    for j in range(int(bind / 0.24)): zap(t + 0.05 + j * 0.24, 0.7)
def hit(t, k=1.0): put('sfx', pitch(KNs('metal_h'), -1), t, 0.7 * k, -0.2, verb=0.4); put('sfx', pitch(K('impactPunch_heavy'), -6), t, 0.5 * k, -0.2)
def ground(t, k=1.0): put('sfx', pitch(K('impactMining'), -6), t, 0.6 * k, 0.1, verb=0.4); put('sfx', pitch(K('impactMetal_heavy'), -6), t, 0.35 * k)
def whoosh(t, k=1.0, p=0.0): put('sfx', pitch(KNs('swing_h'), rng.uniform(1, 3)), t, 0.3 * k, p, verb=0.2)
def servo(t, k=1.0, p=0.0): put('sfx', pitch(KNs('servo'), rng.uniform(-1, 1)), t, 0.12 * k, p)
def hum(t0, t1): put('sfx', fade(filt(pitch(loop(K('forceField'), t1 - t0), -7), 'lowpass', 3000), 0.4, 1.2), t0, 0.06, 0.2, verb=0.1)
def loose(t, k=1.0):  # something heavy torn off, falling, bouncing
    put('sfx', pitch(KNs('metal_h'), -4), t, 0.7 * k, 0.3, verb=0.5)
    for j in range(5): put('sfx', pitch(K('impactMetal_light'), rng.uniform(-4, 2)), t + 0.7 + j * 0.3, 0.14 * k, 0.5)
    put('sfx', pitch(K('impactMetal_heavy'), -5), t + 0.7, 0.35 * k, 0.4)
def flares(t, n=14):
    for j in range(n):
        put('sfx', pitch(K('thrusterFire'), 8)[:int(0.5 * SR)], t + (j % 2) * 0.06 + (j // 2) * 0.05, 0.05, rng.uniform(-0.7, 0.7), verb=0.4)
        put('sfx', pitch(K('impactPunch_medium'), 6), t + (j // 2) * 0.05, 0.05)
def radio(t): put('sfx', filt(K('computerNoise'), 'highpass', 1200)[:int(0.18 * SR)], t, 0.12, -0.4, verb=0)
def arc(t0, t1, k=1.0):
    put('sfx', KNs('bolt'), t0, 0.45 * k, 0.1, verb=0.4); zap(t0, 1.2 * k)
    for j in range(int((t1 - t0) / 0.15)): zap(t0 + 0.1 + j * 0.15, 0.5 * k)
def sparks(c):
    if c.get('t1') is None: zap(c['t'], 0.4); return
    for t in np.arange(c['t'], min(c['t1'], LEN), 0.5): zap(t, 0.2)

SOUNDS = {
    'shot': lambda c: gunshot(c['t'], c.get('n', 0), c.get('hit'), c.get('big'), 0.25 if c.get('big') else -0.25, 0.15 if c.get('big') else 0.2),
    'missile': lambda c: missile(c['t'], c['t1'], c.get('model', 'missile'), c.get('boom', 1.0), 0.35),
    'explosion': lambda c: explosion(c['t'], c.get('k', 1.0), rng.uniform(-0.3, 0.3)),
    'clash': lambda c: clash(c['t'], c.get('k', 1.0), c.get('bind', 0)),
    'hit': lambda c: hit(c['t'], c.get('k', 1.0)),
    'ground': lambda c: ground(c['t'], c.get('k', 1.0)),
    'whoosh': lambda c: whoosh(c['t'], c.get('k', 1.0)),
    'loose': lambda c: loose(c['t'], c.get('k', 1.0)),
    'flares': lambda c: flares(c['t'], c.get('n', 14)),
    'arc': lambda c: arc(c['t'], c.get('t1', c['t'] + 0.3), c.get('k', 1.0)),
    'sparks': sparks,
    'snd': lambda c: {'radio': radio}.get(c.get('name'), lambda t: None)(c['t']),
}
for c in CUE['cues']:
    f = SOUNDS.get(c['kind'])
    if f: f(c)
# footsteps (louder for the first walker while the camera is down at his feet: the second shot of the film)
for s in CUE['steps']:
    if s['t'] < 0.05: continue
    step(s['t'], s['k'], s['land'], 1.5 if 3.5 <= s['t'] < 6.0 and s['who'] == 'ron' else 1.0)
for j in CUE['jets']: jet(j['t0'], j['t1'], 0.8 * min(1.3, j['k']), 0.2 if j['who'] != 'ron' else -0.2)
for r in CUE['rods']: hum(r['t0'], r['t1']); zap(r['t0'] - 0.05, 0.8)
first = next((c for c in CUE['cues'] if c['kind'] == 'shot'), None)
if first: servo(first['t'] - 0.45, 1.2, -0.3)  # the gun coming up into the aim

# the helicopter: the real rotor recording, as loud as it is near; the fly-by recording as it comes overhead
for h in CUE['helis']:
    path = np.array(h['path']); tt = np.arange(N) / SR; d = np.interp(tt, [to_film(x) for x in path[:, 0]], path[:, 1]); g = np.clip(3.2 / (d + 1.0), 0, 1.0) ** 1.3
    bed = loop(load(os.path.join(HELI, 'helicopter_0.mp3')), N / SR + 0.1)[:N]
    BUS['sfx'] += filt(bed, 'lowpass', 6000) * (g[:, None] * 0.55)
    nearest = to_film(float(path[np.argmin(path[:, 1]), 0])); fly = load(os.path.join(HELI, 'heli_0.ogg'))
    env = uniform_filter1d(np.abs(fly).max(axis=1), int(0.3 * SR)); pk = int(np.argmax(env)) / SR
    BUS['sfx'][max(0, int((nearest - pk) * SR)):][:len(fly)] += fade(fly, 1.5, 3)[:max(0, N - max(0, int((nearest - pk) * SR)))] * 0.5

# the city: wind, the fires crackling, the war somewhere else
wind = filt(filt(rng.normal(0, 1, (N, 2)).astype(np.float32), 'lowpass', 400), 'highpass', 60)
BUS['amb'] += wind * (0.6 + 0.4 * np.sin(np.arange(N) / SR * 0.4))[:, None] * 0.018
fires = [c['t'] for c in CUE['cues'] if c['kind'] == 'fire']
t = 0.0
while t < LEN:
    t += rng.exponential(0.05 if any(t > f for f in fires) else 0.09)
    n = int(rng.uniform(0.002, 0.012) * SR); b = rng.normal(0, 1, (n, 2)).astype(np.float32) * np.exp(-np.arange(n) / (n / 4))[:, None]
    put('amb', filt(b, 'bandpass', [rng.uniform(600, 1500), rng.uniform(3000, 7000)]), t, rng.uniform(0.004, 0.03) * (1 + 2 * (rng.random() < 0.08)), rng.uniform(-0.5, 0.5), verb=0.15)
for t in np.arange(2.2, LEN, 7.3): put('amb', filt(pitch(K('lowFrequency_explosion'), -6), 'lowpass', 250), t + rng.uniform(-1, 1), 0.25, rng.uniform(-1, 1), verb=0.8)

# ---------------------------------------------------------------- the orchestra
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def midi(n): m = re.match(r'([A-G][#b]?)(-?\d)', n); return 12 * (int(m.group(2)) + 1) + NOTE[m.group(1)]
class Inst:
    """a folder of samples, each named with its note (VSCO names middle C as C3: every folder sits an octave up,
    checked by autocorrelation)"""
    def __init__(self, folder, gain=1.0):
        self.files = []
        for p in glob.glob(os.path.join(VSCO, folder, '*.wav')):
            m = re.search(r'_([A-G][#b]?-?\d)[_.]', os.path.basename(p))
            if m: self.files.append((midi(m.group(1)), p))
        assert self.files, folder
        self.off = 12; self.gain = gain
    def note(self, n, dur=None, rr=0):
        n = midi(n) if isinstance(n, str) else n
        best = min(self.files, key=lambda f: (abs(f[0] + self.off - n), f[1]))
        cands = [f for f in self.files if f[0] == best[0]]; m0, p = cands[rr % len(cands)]
        x = pitch(load(p), n - (m0 + self.off))
        if dur: x = fade(x[:int(dur * SR)], 0.004, min(0.4, dur * 0.4))
        return x * self.gain
INST = {
    'CB': Inst('Strings/Solo Contrabass/SusVib', 1.2), 'CBs': Inst('Strings/Solo Contrabass/Spic', 1.3), 'VC': Inst('Strings/Cello Section/susvib'), 'VCs': Inst('Strings/Cello Section/spic'),
    'VCt': Inst('Strings/Cello Section/trem'), 'VA': Inst('Strings/Viola Section/susvib'), 'VAs': Inst('Strings/Viola Section/spic'), 'VN': Inst('Strings/Violin Section/susVib', 0.8),
    'VNs': Inst('Strings/Violin Section/Spic', 0.8), 'VNt': Inst('Strings/Violin Section/Trem', 0.8), 'HN': Inst('Brass/F Horn/sus'), 'HNs': Inst('Brass/F Horn/stac'),
    'TB': Inst('Brass/Tenor Trombone/sus'), 'TBs': Inst('Brass/Tenor Trombone/stac'), 'TU': Inst('Brass/Tuba/sus'), 'TUs': Inst('Brass/Tuba/stac'),
}
def play(inst, n, t, dur=None, g=1.0, p=0.0, verb=0.35, rr=0): put('music', INST[inst].note(n, dur, rr), t, g, p, verb)
def perc(folder): return sorted(glob.glob(os.path.join(VSCO, folder, '*.wav')))
PERC = {
    'timp': [p for p in perc('Percussion/Timpani') if 'v3' in p] or perc('Percussion/Timpani'), 'roll': perc('Percussion/Timpani/Rolls'),
    'taiko': [p for p in perc('VSCO 1 Percussion/drums/other/ethnic/giant/mallet') if '_ff' in p or '_f_' in p], 'gong': [p for p in perc('VSCO 1 Percussion/varMetal/Gong') if 'ff' in p],
    'crash': perc('VSCO 1 Percussion/varMetal/Cymbals/clash'), 'susp': [p for p in perc('VSCO 1 Percussion/varMetal/Cymbals/susp') if 'roll' in p.lower()] or perc('VSCO 1 Percussion/varMetal/Cymbals/susp'),
    'snare': [p for p in perc('VSCO 1 Percussion/drums/snare/drum1') if re.search(r'(f|ff)', os.path.basename(p))] or perc('VSCO 1 Percussion/drums/snare/drum1'),
}
def drum(kind, t, g=1.0, p=0.0, verb=0.4, semis=0): f = PERC[kind][int(rng.integers(len(PERC[kind])))]; put('music', pitch(load(f), semis), t, g, p, verb)
CHORD = {'Dm': ('D', 'F', 'A'), 'D': ('D', 'F#', 'A'), 'Bb': ('Bb', 'D', 'F'), 'Gm': ('G', 'Bb', 'D'), 'A': ('A', 'C#', 'E'), 'F': ('F', 'A', 'C'), 'C': ('C', 'E', 'G'), 'Eb': ('Eb', 'G', 'Bb')}
HIT = {'timp': (0.8, 0.45, -2), 'roll': (0.4, 0.45, -2), 'taiko': (1.0, 0.45, 0), 'gong': (0.5, 0.8, 0), 'crash': (0.3, 0.6, 0), 'susp': (0.3, 0.6, 0), 'snare': (0.3, 0.3, 0)}
E8 = 0.3  # an eighth at 100 beats a minute
for ev in CUE['music']:
    g = ev.get('g', 1.0)
    if 'pad' in ev: play(ev['pad'], ev['n'], ev['t'], ev['d'], g, rng.uniform(-0.3, 0.3))
    elif 'line' in ev:
        for n, t, d in ev['notes']: play(ev['line'], n, t, d, g, 0.1, 0.5)
    elif 'hit' in ev: gg, vb, sm = HIT[ev['hit']]; drum(ev['hit'], ev['t'], g * gg, 0, vb, sm)
    elif 'stab' in ev:  # the brass and drums together, on a blow
        r = ev['stab']; fifth = CHORD.get(r + 'm', CHORD.get(r))[2]
        play('TBs', r + '3', ev['t'], None, 0.5 * g); play('TUs', r + '2', ev['t'], None, 0.5 * g); play('HNs', fifth + '3', ev['t'], None, 0.4 * g)
        drum('taiko', ev['t'], 0.8 * g, 0, 0.4); drum('crash', ev['t'], 0.18 * g, 0.3, 0.6)
    elif 'tutti' in ev:  # the whole orchestra on one chord
        a, b, c = CHORD[ev['tutti']]; d = ev['d']; soft = ev.get('soft')
        parts = [('CB', a + '1', 0.7), ('VC', a + '2', 0.5), ('VA', c + '2', 0.4), ('VN', b + '4', 0.35), ('VN', a + '5', 0.3)]
        if not soft: parts += [('TU', a + '1', 0.7), ('TB', a + '2', 0.6), ('TB', c + '2', 0.5), ('HN', a + '3', 0.5), ('HN', b + '3', 0.45), ('HN', c + '3', 0.45)]
        for inst, n, gg in parts: play(inst, n, ev['t'], d, gg * g, rng.uniform(-0.4, 0.4), 0.5 if not soft else 0.6)
        if not soft: drum('taiko', ev['t'], 1.1 * g, 0, 0.5); drum('timp', ev['t'], 0.8 * g, 0, 0.6, -2); drum('crash', ev['t'], 0.35 * g, 0, 0.7)
    elif 'drive' in ev:  # eighth-note strings over chords, a bar of eight each; more voices join bar by bar
        for bar, ch in enumerate(ev['drive']):
            a, b, c = CHORD[ch]; t0 = ev['t'] + bar * 8 * E8; lvl = bar + ev.get('build', 0)
            if t0 >= ev['t1']: break
            bass = [a, a, a, a, a, a, c, a]
            for e in range(8):
                t = t0 + e * E8
                if t >= ev['t1'] - 0.05: break
                acc = 1.0 if e in (0, 3, 6) else 0.7
                play('CBs', bass[e] + '1', t, 0.35, 0.55 * acc, -0.2, 0.25, rr=e); play('VCs', bass[e] + '2', t, 0.35, 0.45 * acc, -0.3, 0.25, rr=e + 1)
                if lvl >= 1: play('VAs', b + '3', t, 0.3, 0.22 * acc, 0.3, 0.3, rr=e)
                if lvl >= 2: play('VNs', c + '4' if e % 2 == 0 else a + '5', t, 0.3, 0.2 * acc, 0.5, 0.35, rr=e)
                if e in (0, 3, 6): drum('taiko', t, 0.55 if e else 0.75, 0, 0.35)
                if lvl >= 1 and e in (2, 6): drum('snare', t, 0.22, 0.2, 0.3)
                if e == 0: drum('timp', t, 0.45, 0, 0.4, -2)
            dd = min(8 * E8, ev['t1'] - t0)
            play('VC', a + '2', t0, dd, 0.18); play('HN', b + '3', t0, dd, 0.16 + 0.03 * lvl, 0.15); play('HN', c + '3', t0 + 0.02, dd, 0.12 + 0.03 * lvl, -0.15)

# ---------------------------------------------------------------- the mix
def reverb(x, secs=2.2, pre=0.02):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, (n, 2)).astype(np.float32) * np.exp(-t * 6.9 / secs)[:, None]
    ir = filt(ir, 'lowpass', 5000); ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(axis=0))
    return np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1).astype(np.float32)
music, sfx = BUS['music'], BUS['sfx']
if os.environ.get('STEMS'):
    for k, v in BUS.items(): sf.write(os.path.join(HERE, f'stem_{k}.wav'), v / max(1e-6, np.abs(v).max()) * 0.9, SR)
# the music steps back under the loudest moments
env = uniform_filter1d(np.abs(sfx).max(axis=1), int(0.05 * SR))
duck = uniform_filter1d(1 / (1 + np.clip(env - 0.25, 0, None) * 1.2), int(0.2 * SR))
VERB = reverb(BUS['verb'])

# ---------------------------------------------------------------- the voices, one mix per language
def voice_fx(x, fx):
    x = filt(x, 'highpass', 110)
    if fx == 'radio':  # a radio: narrow, a little driven, with hiss under it and a squelch either end
        x = filt(filt(x, 'highpass', 320, 4), 'lowpass', 3300, 4); x = np.tanh(x * 3.0) / 3.0
        hiss = filt(rng.normal(0, 1, x.shape).astype(np.float32), 'bandpass', [1500, 6000]) * 0.012; x = x + hiss
    elif fx == 'helmet': x = filt(x, 'lowpass', 5200); x = np.tanh(x * 2.0) / 2.0
    else:  # in a cockpit: close, a touch of presence, a small hard room
        x = filt(x, 'lowpass', 7800); x = x + filt(x, 'bandpass', [2200, 4200]) * 0.35; x = np.tanh(x * 1.4) / 1.4
    return x
def room(x, secs=0.35):
    n = int(secs * SR); t = np.arange(n) / SR; ir = rng.normal(0, 1, (n, 2)).astype(np.float32) * np.exp(-t * 18)[:, None]; ir[0] = 1.5; ir /= np.sqrt((ir ** 2).sum(axis=0))
    return np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1).astype(np.float32)
VOICES = os.path.join(HERE, f'voices_{EP}.json')
LANGS = json.load(open(VOICES, encoding='utf-8')) if os.path.exists(VOICES) else {'zh': [], 'en': []}
out = os.path.join(HERE, '..', 'audio'); os.makedirs(out, exist_ok=True)
# how long each line really takes to say, so the player keeps its subtitle up until it has been said
json.dump({lang: [[round(L['t'] - 0.04, 3), round(L['dur'], 3)] for L in lines] for lang, lines in LANGS.items()}, open(os.path.join(out, f'{EP}.lines.json'), 'w'))
for lang, lines in LANGS.items():
    dlg = np.zeros((N, 2), np.float32)
    for L in lines:
        x = load(L['file']); x = x / max(1e-6, float(np.sqrt((x ** 2).mean()))) * 0.11 * (1.25 if L['loud'] else 1.0)
        x = voice_fx(x, L['fx'])
        if L['fx'] == 'radio':
            sq = filt(K('computerNoise'), 'highpass', 1500)[:int(0.12 * SR)] * 0.25
            x = np.concatenate([sq, x, sq[::-1]]); start = to_film(L['t']) - 0.12
        else: x = room(x) * 0.85 + x * 0.15; start = to_film(L['t'])
        i = max(0, int(start * SR)); n = min(len(x), N - i)
        dlg[i:i + n] += pan(x[:n], 0.0)
    # everything else steps back while someone is speaking
    venv = uniform_filter1d(np.abs(dlg).max(axis=1), int(0.08 * SR)); speak = np.clip(venv / 0.05, 0, 1)
    speak = uniform_filter1d(speak, int(0.3 * SR))  # ease in and out of the ducking
    mduck = 1 - 0.65 * speak; sduck = 1 - 0.35 * speak
    mix = sfx * sduck[:, None] + music * db(-4) * (duck * mduck)[:, None] + BUS['amb'] * sduck[:, None] + VERB * db(-6) + dlg
    mix = filt(mix, 'highpass', 28)
    tt = np.arange(N) / SR; mix *= np.clip(tt / 0.6, 0, 1)[:, None] * np.clip((FILM + 0.6 - tt) / 1.2, 0, 1)[:, None]
    # level: the loudest few moments (the top 0.05 % of samples) at -1 dB; a look-ahead limiter catches what is above
    peak = np.abs(mix).max(axis=1); mix *= db(-1) / max(1e-6, float(np.percentile(peak, 99.95))); peak = np.abs(mix).max(axis=1)
    look = int(0.004 * SR)
    g = minimum_filter1d(np.minimum(1, db(-1) / np.maximum(peak, 1e-6)), size=2 * look + 1)
    g = uniform_filter1d(minimum_filter1d(g, size=int(0.02 * SR)), size=int(0.02 * SR))
    mix = np.clip(mix * g[:, None], -db(-0.5), db(-0.5))[:int((FILM + 0.6) * SR)]
    wav = os.path.join(HERE, f'{EP}.{lang}.wav'); sf.write(wav, mix, SR, subtype='PCM_24')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '1' if FILM < 90 else '3', os.path.join(out, f'{EP}.{lang}.mp3')], check=True)
    print(EP, lang, len(lines), 'lines', 'film', round(FILM, 1), 'peak', round(float(np.abs(mix).max()), 3), 'rms dB', round(float(20 * np.log10(np.sqrt((mix ** 2).mean()))), 1))
