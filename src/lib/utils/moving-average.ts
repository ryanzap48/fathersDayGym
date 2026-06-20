/**
 * Trailing simple moving average over a series of { x, y } points.
 * Window is in number of points (e.g. 7 for a 7-sample average).
 * The average at each point uses up to the last `window` values, so early
 * points settle in gracefully rather than being dropped.
 */
export interface Point {
  x: string | number;
  y: number;
}

export function movingAverage<T extends Point>(
  points: T[],
  window: number,
): (T & { avg: number })[] {
  const out: (T & { avg: number })[] = [];
  let runningSum = 0;
  const buf: number[] = [];

  for (const p of points) {
    buf.push(p.y);
    runningSum += p.y;
    if (buf.length > window) runningSum -= buf.shift()!;
    out.push({ ...p, avg: runningSum / buf.length });
  }
  return out;
}
