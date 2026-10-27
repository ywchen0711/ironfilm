"""The soundtrack of Night of the Ravens: real recordings and a real orchestra, mixed to the film's own timeline.

    node tools/cues.mjs > tools/cues.json         # the beats, the gunshots, every footstep (from the film's code)
    python -P tools/mix.py RAW KN FIRE VSCO        # -> audio/soundtrack.mp3

RAW   Kenney's Impact Sounds and Sci-fi Sounds, unzipped flat (CC0, kenney.nl)
KN    Kaiju Night's designed effects (github.com/ywchen0711/kaiju-night, sfx/; CC0, built from CC0 recordings)
FIRE  The Free Firearm Sound Library, "Prepared SFX Library" (CC0, opengameart.org/content/the-free-firearm-sound-library)
VSCO  Versilian Studios Chamber Orchestra 2 Community Edition (CC0, github.com/sgossner/VSCO-2-CE)
Needs numpy, scipy, soundfile and ffmpeg.
"""
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve

SR = 48000
RAW, KN, FIRE, VSCO = sys.argv[1:5]
HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cues.json')))
T, LEN = CUE['T'], CUE['LEN']
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- loading and shaping
_cache = {}
def load(path):
    if path in _cache: return _cache[path]
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    if x.shape[1] == 1: x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr); x = resample_poly(x, SR // g, sr // g, axis=0).astype(np.float32)
    x = x / max(1e-6, float(np.abs(x).max())) * 0.9  # every recording at the same peak, so the gains below mean something
    _cache[path] = x
    return x

def pitch(x, semis):
    """varispeed: pitch and length change together, like a tape slowed down"""
    if abs(semis) < 0.01: return x
    r = 2 ** (semis / 12); up, down = 1000, int(round(1000 * r))
    return resample_poly(x, up, down, axis=0).astype(np.float32)

def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos'); return sosfilt(sos, x, axis=0).astype(np.float32)

def fade(x, a=0.002, b=0.05):
    x = x.copy(); n = len(x); na, nb = min(n, int(a * SR)), min(n, int(b * SR))
    if na: x[:na] *= np.linspace(0, 1, na)[:, None]
    if nb: x[-nb:] *= np.linspace(1, 0, nb)[:, None]
    return x

def cut(x, t0, t1): return x[int(t0 * SR):int(t1 * SR)]
def db(v): return 10 ** (v / 20)

def pan(x, p):
    """p from -1 (left) to 1 (right), equal power"""
    a = (p + 1) * np.pi / 4; return x * np.array([np.cos(a), np.sin(a)], dtype=np.float32) * 1.414

N = int((LEN + 1.5) * SR)
BUS = {k: np.zeros((N, 2), np.float32) for k in ('sfx', 'verb', 'music', 'amb')}
def put(bus, x, t, g=1.0, p=0.0, verb=0.25):
    i = int(t * SR)
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

# ---------------------------------------------------------------- the effects
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
    d = t1 - t0
    x = K('thrusterFire'); x = np.tile(x, (int(d / (len(x) / SR)) + 2, 1))[:int((d + 0.4) * SR)]
    x = filt(pitch(x, -3), 'lowpass', 5000)
    env = np.minimum(1, np.minimum(np.arange(len(x)) / (0.06 * SR), (len(x) - np.arange(len(x))) / (0.35 * SR)))[:, None]
    put('sfx', x * env, t0, 0.3 * g, p, verb=0.3)
    put('sfx', fade(cut(filt(pitch(K('spaceEngineLarge'), -5), 'lowpass', 1500), 0, d + 0.3), 0.05, 0.3), t0, 0.16 * g, p)

def explosion(t, k=1.0, p=0.0):
    put('sfx', pitch(KNs('explosion'), rng.uniform(-2, 0)), t, 0.8 * k, p, verb=0.5)
    put('sfx', pitch(K('explosionCrunch'), -6), t, 0.45 * k, p, verb=0.5)
    put('sfx', filt(pitch(K('lowFrequency_explosion'), -2), 'lowpass', 300), t, 0.8 * k, p, verb=0.2)
    for j in range(int(3 * k) + 1): put('sfx', pitch(K('impactMining'), rng.uniform(-6, 0)), t + 0.25 + rng.uniform(0, 0.9), 0.12 * k, rng.uniform(-0.8, 0.8))
    if k > 0.9: put('sfx', pitch(K('impactGlass_heavy'), -3), t + 0.35, 0.18 * k, rng.uniform(-0.8, 0.8), verb=0.6)

# the machine gun: single shots cut from a real AK-47 recording, a little lower for a gun this size
def ak_shots():
    x = load(os.path.join(FIRE, 'AK-47', 'C_28P.wav'))
    m = np.abs(x).max(axis=1); env = np.convolve(m, np.ones(96) / 96, mode='same')
    thr = env.max() * 0.25; on = []; i = 0
    while i < len(env):
        if env[i] > thr: on.append(i); i += int(0.35 * SR)
        else: i += 1
    return [fade(x[max(0, o - int(0.004 * SR)): o + int(0.8 * SR)], 0.001, 0.3) for o in on] or [x[:int(0.8 * SR)]]
SHOT = ak_shots()
def gunshot(t, j, hit, p=0.0):
    s = SHOT[j % len(SHOT)]
    put('sfx', pitch(s, -2.5 + rng.uniform(-0.4, 0.4)), t, 0.75, p, verb=0.35)
    put('sfx', filt(pitch(K('impactPunch_heavy'), -14), 'lowpass', 500), t, 0.25, p, verb=0)
    if j % 2 == 0: put('sfx', pitch(K('impactMetal_light'), 7), t + 0.25 + rng.uniform(0, 0.2), 0.06, p + 0.3) # brass falling
    if hit: put('sfx', pitch(K('impactMetal_heavy'), rng.uniform(-3, 0)), t + 0.2, 0.32, -p, verb=0.3)
    else: put('sfx', pitch(K(rng.choice(['impactPlate_light', 'impactMining', 'impactGlass_light'])), rng.uniform(-2, 3)), t + 0.2 + rng.uniform(0, 0.05), 0.07, -p * 0.5 + rng.uniform(-0.5, 0.5), verb=0.5)

def missile(t0, t1, p=0.0):
    put('sfx', filt(pitch(K('impactPunch_heavy'), -9), 'lowpass', 1200), t0, 0.5, p)
    put('sfx', pitch(K('laserLarge'), -10), t0, 0.25, p, verb=0.4)
    put('sfx', fade(cut(pitch(KNs('thrust'), 2), 0, t1 - t0 + 0.1), 0.01, 0.15), t0, 0.5, p, verb=0.3)
    jet(t0, t1, 0.5, p)

def clash(t, k=1.0):
    k *= 1.3
    put('sfx', pitch(KNs('metal_h'), 3), t, 0.6 * k, 0, verb=0.5)
    put('sfx', pitch(K('impactBell_heavy'), -5), t, 0.25 * k, 0, verb=0.6)
    put('sfx', pitch(K('impactMetal_heavy'), -2), t, 0.35 * k)
    put('sfx', KNs('bolt'), t, 0.22 * k, 0, verb=0.4)

def whoosh(t, k=1.0, p=0.0): put('sfx', pitch(KNs('swing_h'), rng.uniform(1, 3)), t, 0.3 * k, p, verb=0.2)
def zap(t, k=1.0): put('sfx', pitch(KNs('plasma'), rng.uniform(-1, 2)), t, 0.22 * k, rng.uniform(-0.3, 0.3), verb=0.3)
def servo(t, k=1.0, p=0.0): put('sfx', pitch(KNs('servo'), rng.uniform(-1, 1)), t, 0.12 * k, p)

def rod_hum(t0, t1):
    x = K('forceField'); x = np.tile(x, (int((t1 - t0) / (len(x) / SR)) + 2, 1))[:int((t1 - t0) * SR)]
    x = filt(pitch(x, -7), 'lowpass', 3000)
    put('sfx', fade(x, 0.4, 1.2), t0, 0.06, 0.2, verb=0.1)

# ---------------------------------------------------------------- the action, cue by cue
for s in CUE['steps']:
    loud = 1.5 if 3.5 <= s['t'] < 6.0 and s['who'] == 'ron' else 1.0
    if s['who'] == 'hound' and s['t'] < 6.3: continue
    step(s['t'], s['k'], s['land'], loud)
jet(6.2, T['land'] + 0.05, 1.0, 0.2); jet(9.45, 10.3, 0.8, 0.4); jet(T['leap'] - 0.05, T['leapLand'], 0.8, -0.2)
jet(T['charge'] - 0.05, T['clash'], 1.3, 0.3); jet(T['jump'] - 0.05, 23.95, 1.2, -0.1)
servo(T['raise'], 1.2, -0.3)
for j, s in enumerate(CUE['shots']): gunshot(s['t'], j, s['hit'], -0.25)
missile(T['missile1'], T['boom1'], 0.4); missile(T['missile2'], T['boom2'], 0.45)
explosion(T['boom1'], 1.2, -0.3); explosion(T['boom2'], 1.0, 0.3)
zap(13.85, 0.8); rod_hum(13.9, 27.0)
whoosh(15.15, 1.3); clash(T['clash'], 1.4)
for k in range(8): put('sfx', pitch(K('impactPlate_medium'), rng.uniform(-6, -2)), T['clash'] + 0.12 + k * 0.11, 0.08) # the blade grinding on the rod
for k in range(4): zap(T['clash'] + 0.05 + k * 0.24, 0.7)
whoosh(T['part'], 1.0); servo(T['part'] + 0.1)
for i, te in enumerate(T['slash']):
    whoosh(te - 0.16, 1.1)
    if i < 2: clash(te, 0.85); zap(te + 0.02, 0.5)
    else: put('sfx', pitch(KNs('metal_h'), -1), te, 0.8, -0.2, verb=0.4); put('sfx', pitch(K('impactPunch_heavy'), -6), te, 0.6, -0.2)
whoosh(T['over'] - 0.22, 1.3); put('sfx', pitch(K('impactMining'), -6), T['over'] + 0.03, 0.7, 0.1, verb=0.4); put('sfx', pitch(K('impactMetal_heavy'), -6), T['over'] + 0.03, 0.4)
whoosh(T['counter'] - 0.12, 1.1); zap(T['counter'], 1.4); put('sfx', KNs('bolt'), T['counter'], 0.6, 0.2, verb=0.4)
put('sfx', pitch(KNs('metal_h'), -4), T['armOff'], 0.9, 0.3, verb=0.5); explosion(T['armOff'] + 0.02, 0.45, 0.3)
for k in range(5): put('sfx', pitch(K('impactMetal_light'), rng.uniform(-4, 2)), T['armOff'] + 0.7 + k * 0.33, 0.14, 0.5) # the arm bouncing away
for k in range(10): zap(T['armOff'] + 0.5 + k * 0.4, 0.25)
whoosh(24.3, 1.4)
clash(T['strike'], 1.6); put('sfx', pitch(KNs('bolt'), -2), T['strike'], 0.8, 0, verb=0.6); explosion(T['strike'] + 0.03, 0.6)
explosion(T['boomA'], 0.8, 0.2); explosion(T['boomB'], 1.6, 0.1)
put('sfx', pitch(KNs('collapse'), 2), T['fall'] + 0.3, 0.7, 0.1, verb=0.5)
# radio clicks around HQ's call
for t in (3.95, 6.0): put('sfx', filt(K('computerNoise'), 'highpass', 1200)[:int(0.18 * SR)], t, 0.12, -0.4, verb=0)

# the city: wind, a fire crackling, the war somewhere else
wind = filt(rng.normal(0, 1, (N, 2)).astype(np.float32), 'lowpass', 400); wind = filt(wind, 'highpass', 60)
mod = (0.6 + 0.4 * np.sin(np.arange(N) / SR * 0.4))[:, None]; BUS['amb'] += wind * mod * 0.018
# the fire: clusters of short cracks (bursts of noise a few thousandths of a second long, each a different colour)
t = 0.0
while t < LEN:
    t += rng.exponential(0.09)
    n = int(rng.uniform(0.002, 0.012) * SR); b = rng.normal(0, 1, (n, 2)).astype(np.float32) * np.exp(-np.arange(n) / (n / 4))[:, None]
    b = filt(b, 'bandpass', [rng.uniform(600, 1500), rng.uniform(3000, 7000)])
    put('amb', b, t, rng.uniform(0.004, 0.03) * (1 + 2 * (rng.random() < 0.08)), rng.uniform(-0.5, 0.5), verb=0.15)
for t in (2.2, 5.1, 13.0, 19.5, 28.0): put('amb', filt(pitch(K('lowFrequency_explosion'), -6), 'lowpass', 250), t, 0.25, rng.uniform(-1, 1), verb=0.8)

# ---------------------------------------------------------------- the orchestra
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def midi(n):
    m = re.match(r'([A-G][#b]?)(-?\d)', n); return 12 * (int(m.group(2)) + 1) + NOTE[m.group(1)]
class Inst:
    """a folder of samples, each named with its note; the names are checked against the real pitch"""
    def __init__(self, folder, gain=1.0):
        self.files = []
        for p in glob.glob(os.path.join(VSCO, folder, '*.wav')):
            m = re.search(r'_([A-G][#b]?-?\d)[_.]', os.path.basename(p))
            if m: self.files.append((midi(m.group(1)), p))
        assert self.files, folder
        self.off = 12; self.gain = gain  # VSCO names its notes with middle C as C3 (checked by autocorrelation: every folder is one octave up)
    def note(self, n, dur=None, rr=0):
        n = midi(n) if isinstance(n, str) else n
        best = min(self.files, key=lambda f: (abs(f[0] + self.off - n), f[1]))
        cands = [f for f in self.files if f[0] == best[0]]; m0, p = cands[rr % len(cands)]
        x = pitch(load(p), n - (m0 + self.off))
        if dur: x = fade(x[:int(dur * SR)], 0.004, min(0.4, dur * 0.4))
        return x * self.gain
def play(inst, n, t, dur=None, g=1.0, p=0.0, verb=0.35, rr=0): put('music', inst.note(n, dur, rr), t, g, p, verb)

CB = Inst('Strings/Solo Contrabass/SusVib', 1.2); CBs = Inst('Strings/Solo Contrabass/Spic', 1.3)
VC = Inst('Strings/Cello Section/susvib'); VCs = Inst('Strings/Cello Section/spic'); VCt = Inst('Strings/Cello Section/trem')
VA = Inst('Strings/Viola Section/susvib'); VAs = Inst('Strings/Viola Section/spic')
VN = Inst('Strings/Violin Section/susVib', 0.8); VNs = Inst('Strings/Violin Section/Spic', 0.8); VNt = Inst('Strings/Violin Section/Trem', 0.8)
HN = Inst('Brass/F Horn/sus'); HNs = Inst('Brass/F Horn/stac'); TB = Inst('Brass/Tenor Trombone/sus'); TBs = Inst('Brass/Tenor Trombone/stac')
TU = Inst('Brass/Tuba/sus'); TUs = Inst('Brass/Tuba/stac')
def perc(folder, pat='*'): return sorted(glob.glob(os.path.join(VSCO, folder, pat)))
TIMP = [p for p in perc('Percussion/Timpani') if 'v3' in p] or perc('Percussion/Timpani')
TROLL = perc('Percussion/Timpani/Rolls'); BD = [p for p in perc('VSCO 1 Percussion/drums/bass') if re.search(r'_(f|ff|fff)_', p)] or perc('VSCO 1 Percussion/drums/bass')
TAIKO = [p for p in perc('VSCO 1 Percussion/drums/other/ethnic/giant/mallet') if '_ff' in p or '_f_' in p]
GONG = [p for p in perc('VSCO 1 Percussion/varMetal/Gong') if 'ff' in p]; CRASH = perc('VSCO 1 Percussion/varMetal/Cymbals/clash')
SUSP = perc('VSCO 1 Percussion/varMetal/Cymbals/susp'); SN = [p for p in perc('VSCO 1 Percussion/drums/snare/drum1') if re.search(r'(f|ff)', os.path.basename(p))] or perc('VSCO 1 Percussion/drums/snare/drum1')
def hit(files, t, g=1.0, p=0.0, verb=0.4, semis=0, k=None):
    f = files[k % len(files)] if k is not None else files[int(rng.integers(len(files)))]
    put('music', pitch(load(f), semis), t, g, p, verb)

E8 = 0.3  # an eighth at 100 beats a minute
# 0 - 7: the empty street. A low D held in the basses, a slow chord in the cellos and violas, a soft gong under the title
play(CB, 'D1', 0.0, 7.4, 0.5, -0.2); play(VC, 'D2', 0.3, 7.0, 0.35, -0.3); play(VA, 'A2', 1.2, 6.0, 0.25, 0.3)
hit(GONG, 0.75, 0.25, 0, 0.9); hit(TROLL, 0.2, 0.12, 0, 0.5, -2)
play(VA, 'F3', 3.6, 3.6, 0.22, 0.3); play(HN, 'D3', 4.4, 3.0, 0.22, 0.1); play(HN, 'A3', 5.2, 2.2, 0.16, -0.1)
# the Hound drops: violins tremble up to it, the drums land with it
play(VNt, 'A4', 5.9, 1.3, 0.35, 0.4); play(VNt, 'D5', 6.3, 0.9, 0.3, 0.5)
hit(TAIKO, T['land'], 1.0, 0, 0.5); hit(TIMP, T['land'], 0.8, 0, 0.5, -2); hit(GONG, T['land'], 0.35, 0, 0.8)
play(TB, 'D2', T['land'], 2.2, 0.4); play(TU, 'D1', T['land'], 2.2, 0.45); play(HN, 'F3', T['land'], 2.0, 0.3, 0.2)
# 7 - 9: the words; a held Bb chord, a timpani roll growing
play(CB, 'Bb0', 7.6, 1.8, 0.5); play(VC, 'F2', 7.6, 1.8, 0.35); play(VA, 'D3', 7.7, 1.7, 0.25)
hit(TROLL, 8.0, 0.35, 0, 0.4, -2)
# 9.2 - 23.6: the fight. Spiccato basses and cellos drive eighths; drums on the beats; brass on the blows
CH = [('D', 'F', 'A'), ('Bb', 'D', 'F'), ('G', 'Bb', 'D'), ('A', 'C#', 'E'), ('D', 'F', 'A'), ('Bb', 'D', 'F')]
BASS = [['D', 'D', 'D', 'D', 'C', 'C', 'D', 'A'], ['Bb', 'Bb', 'Bb', 'Bb', 'A', 'A', 'Bb', 'F'], ['G', 'G', 'G', 'G', 'F', 'F', 'G', 'D'], ['A', 'A', 'A', 'A', 'G', 'G', 'A', 'E'], ['D', 'D', 'D', 'D', 'C', 'C', 'D', 'A'], ['Bb', 'Bb', 'Bb', 'Bb', 'C', 'C', 'D', 'E']]
octv = lambda n, o: n + str(o)
for bar in range(6):
    t0 = 9.2 + bar * 8 * E8
    for e in range(8):
        t = t0 + e * E8
        if t >= 23.55: break
        acc = 1.0 if e in (0, 3, 6) else 0.7
        play(CBs, octv(BASS[bar][e], 1), t, 0.35, 0.55 * acc, -0.2, 0.25, rr=e)
        play(VCs, octv(BASS[bar][e], 2), t, 0.35, 0.45 * acc, -0.3, 0.25, rr=e + 1)
        if bar >= 1: play(VAs, octv(CH[bar][1], 3), t, 0.3, 0.22 * acc, 0.3, 0.3, rr=e)
        if bar >= 2: play(VNs, octv(CH[bar][2], 4) if e % 2 == 0 else octv(CH[bar][0], 5), t, 0.3, 0.2 * acc, 0.5, 0.35, rr=e)
        if e in (0, 3, 6): hit(TAIKO, t, 0.55 if e else 0.75, 0, 0.35)
        if bar >= 1 and e in (2, 6): hit(SN, t, 0.22, 0.2, 0.3)
        if e == 0: hit(TIMP, t, 0.45, 0, 0.4, -2)
    # held chords over each bar
    a, b, c = CH[bar]
    if t0 < 23.5:
        d = min(8 * E8, 23.55 - t0)
        play(VC, octv(a, 2), t0, d, 0.18); play(HN, octv(b, 3), t0, d, 0.16 + 0.03 * bar, 0.15); play(HN, octv(c, 3), t0 + 0.02, d, 0.12 + 0.03 * bar, -0.15)
# the blows: brass stabs and drums
for t, g in [(T['boom1'], 1.0), (T['boom2'], 0.7), (T['clash'], 1.2), (T['slash'][0], 0.6), (T['slash'][1], 0.6), (T['slash'][2], 0.8), (T['armOff'], 1.0)]:
    play(TBs, 'D3', t, None, 0.5 * g); play(TUs, 'D2', t, None, 0.5 * g); play(HNs, 'A3', t, None, 0.4 * g); hit(TAIKO, t, 0.8 * g, 0, 0.4); hit(CRASH, t, 0.18 * g, 0.3, 0.6)
# a rising horn line under the charge
for k, n in enumerate(['D3', 'E3', 'F3', 'G3', 'A3']): play(HN, n, 13.9 + k * 0.3, 0.32, 0.25 + 0.04 * k)
# 23.6 - 24.6: in the air. Everything stops but a high tremolo and a cymbal swelling
play(VNt, 'D5', 23.5, 1.15, 0.45, 0.3); play(VNt, 'A5', 23.7, 0.95, 0.3, -0.3)
sw = [p for p in SUSP if 'roll' in p.lower()] or SUSP
hit(sw, 23.6, 0.25, 0, 0.5)
# 24.6: the blow lands. The whole orchestra on D minor, the gong, the big drums
tS = T['strike']
for inst, n, g in [(TU, 'D1', 0.7), (TB, 'D2', 0.6), (TB, 'A2', 0.5), (HN, 'D3', 0.5), (HN, 'F3', 0.45), (HN, 'A3', 0.45), (CB, 'D1', 0.7), (VC, 'D2', 0.5), (VA, 'A2', 0.4), (VN, 'F4', 0.35), (VN, 'D5', 0.3)]:
    play(inst, n, tS, 3.4, g, rng.uniform(-0.4, 0.4), 0.5)
hit(GONG, tS, 0.7, 0, 0.8); hit(TAIKO, tS, 1.1, 0, 0.5); hit(TIMP, tS, 0.8, 0, 0.6, -2); hit(CRASH, tS, 0.35, 0, 0.7)
hit(TAIKO, T['boomB'], 0.9, 0, 0.5); hit(TIMP, T['boomB'], 0.6, 0, 0.5, -4)
# 27 - 30: what is left. Strings settle on D major, one horn calls over them
for inst, n, g in [(CB, 'D1', 0.35), (VC, 'A2', 0.3), (VA, 'F#3', 0.25), (VN, 'D4', 0.22), (VN, 'A4', 0.16)]: play(inst, n, 27.2, 3.2, g, rng.uniform(-0.4, 0.4), 0.6)
for n, t, d in [('A3', 27.6, 0.6), ('D4', 28.2, 0.5), ('C#4', 28.7, 0.4), ('D4', 29.1, 1.3)]: play(HN, n, t, d, 0.28, 0.1, 0.6)
hit(GONG, 28.3, 0.18, 0, 0.9)

# ---------------------------------------------------------------- the mix
def reverb(x, secs=2.2, pre=0.02):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, (n, 2)).astype(np.float32) * np.exp(-t * 6.9 / secs)[:, None]
    ir = filt(ir, 'lowpass', 5000); ir[:int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(axis=0))
    return np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1).astype(np.float32)

music = BUS['music']; sfx = BUS['sfx']
if os.environ.get('STEMS'):
    for k, v in BUS.items(): sf.write(os.path.join(HERE, f'stem_{k}.wav'), v / max(1e-6, np.abs(v).max()) * 0.9, SR)
# the music steps back under the loudest moments
env = np.convolve(np.abs(sfx).max(axis=1), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode='same')
duck = 1 / (1 + np.clip(env - 0.25, 0, None) * 1.2); duck = np.convolve(duck, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode='same')
mix = sfx * db(0) + music * db(-4) * duck[:, None] + BUS['amb'] + reverb(BUS['verb']) * db(-6)
mix = filt(mix, 'highpass', 28)
# fade in and out with the picture
tt = np.arange(N) / SR; mix *= np.clip(tt / 0.6, 0, 1)[:, None] * np.clip((LEN + 0.6 - tt) / 1.2, 0, 1)[:, None]
# level: the loudest few moments (the top 0.05 % of samples) set at -1 dB; a look-ahead limiter catches what is above
peak = np.abs(mix).max(axis=1); mix *= db(-1) / max(1e-6, float(np.percentile(peak, 99.95))); peak = np.abs(mix).max(axis=1)
from scipy.ndimage import minimum_filter1d, uniform_filter1d
look = int(0.004 * SR)
g = minimum_filter1d(np.minimum(1, db(-1) / np.maximum(peak, 1e-6)), size=2 * look + 1)
g = uniform_filter1d(minimum_filter1d(g, size=int(0.02 * SR)), size=int(0.02 * SR))  # smooth, so the limiting does not crackle
mix = np.clip(mix * g[:, None], -db(-0.5), db(-0.5))
mix = mix[:int((LEN + 0.6) * SR)]
out = os.path.join(HERE, '..', 'audio'); os.makedirs(out, exist_ok=True)
wav = os.path.join(HERE, 'soundtrack.wav'); sf.write(wav, mix, SR, subtype='PCM_24')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '1', os.path.join(out, 'soundtrack.mp3')], check=True)
print('peak', float(np.abs(mix).max()), 'rms dB', float(20 * np.log10(np.sqrt((mix ** 2).mean()))), 'secs', len(mix) / SR)
