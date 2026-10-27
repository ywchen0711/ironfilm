// Slow motion. A story can slow its world down over stretches: warp = [[from, to, rate], ...] in story time, rate
// 0.25 = four times slower. Everything in a story (moves, cues, shots, words, music) is written in story time; the
// player turns the film's clock into story time, and the sound mix turns story time back into the film's.
export function makeClock(story) {
  const W = (story.warp || []).slice().sort((a, b) => a[0] - b[0]);
  // the film's length: each slow stretch lasts (to - from) / rate
  const filmLen = story.LEN + W.reduce((s, [a, b, r]) => s + (b - a) / r - (b - a), 0);
  function toStory(tf) { // film time -> story time
    let f = 0, w = 0;
    for (const [a, b, r] of W) {
      if (tf - f <= a - w) return w + (tf - f);
      f += a - w; w = a;
      const span = (b - a) / r;
      if (tf - f <= span) return w + (tf - f) * r;
      f += span; w = b;
    }
    return w + (tf - f);
  }
  function toFilm(tw) { // story time -> film time
    let f = 0, w = 0;
    for (const [a, b, r] of W) {
      if (tw <= a) return f + (tw - w);
      f += a - w; w = a;
      if (tw <= b) return f + (tw - a) / r;
      f += (b - a) / r; w = b;
    }
    return f + (tw - w);
  }
  const rateAt = (tw) => { for (const [a, b, r] of W) if (tw >= a && tw < b) return r; return 1; };
  return { filmLen, toStory, toFilm, rateAt, warp: W };
}
