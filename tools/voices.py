"""The spoken lines of an episode, in both languages, from neural voices (Microsoft Edge's read-aloud voices, through
the edge-tts package): each character has its voice, pitch and speed (js/cast/characters.js); a shouted line (one
that ends in ! or ！) comes a little faster, higher and louder. A line too long for its subtitle is sped up to fit
(without changing its pitch). Recordings are cached in tools/voice_cache/.

    node tools/cues.mjs ep2 > tools/cues.json
    python tools/voices.py                      # -> tools/voices_ep2.json, read by tools/mix.py
Needs edge-tts and ffmpeg.
"""
import asyncio, hashlib, json, os, subprocess, sys
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'cues_ep1.json'), encoding='utf-8'))
CACHE = os.path.join(HERE, 'voice_cache'); os.makedirs(CACHE, exist_ok=True)

def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    return float(out.strip() or 0)

async def say(text, voice, pitch, rate, path):
    if os.path.exists(path) and os.path.getsize(path) > 0: return
    c = edge_tts.Communicate(text, voice, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz')
    await c.save(path)

async def main():
    out = {}
    for lang, lines in CUE['lines'].items():
        res = []
        for t0, t1, who, text, *rest in lines:
            v = CUE['voices'].get(who)
            if not v or not text.strip(' .…'): continue
            voice, pitch, rate = v[lang]
            loud = text.rstrip().endswith(('!', '！'))
            if loud: pitch += 8; rate += 8
            spoken = text.replace('……', '…').replace('...', '…')
            key = hashlib.sha1(f'{voice}|{pitch}|{rate}|{spoken}'.encode()).hexdigest()[:16]
            raw = os.path.join(CACHE, f'{key}.mp3')
            for attempt in range(8):
                try: await asyncio.wait_for(say(spoken, voice, pitch, rate, raw), 30); break
                except Exception as e:
                    if os.path.exists(raw): os.remove(raw)
                    await asyncio.sleep(2 + attempt)
            if not os.path.exists(raw): print('  no recording for', lang, who, text); continue
            d, room = duration(raw), (t1 - t0) - 0.1
            fit = raw
            if d > room + 0.05:  # too long for the subtitle: speed it up (up to 1.45x), keeping the pitch
                k = min(1.45, d / room); fit = os.path.join(CACHE, f'{key}_x{k:.2f}.wav')
                if not os.path.exists(fit): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-filter:a', f'atempo={k:.3f}', fit], check=True)
                if d / k > room + 0.15: print(f'  {lang} {t0:6.1f} {who:7s} runs {d / k - room:.2f}s past its subtitle: {text}')
                d = d / k
            res.append({ 't': t0 + 0.04, 'who': who, 'file': fit, 'dur': round(d, 3), 'fx': v.get('fx', 'cockpit'), 'loud': loud })
        out[lang] = res
        print(lang, len(res), 'lines')
    json.dump(out, open(os.path.join(HERE, f"voices_{CUE['ep']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

asyncio.run(main())
