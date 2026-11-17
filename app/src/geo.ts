export type LngLat = [number, number];

// Round off the corners of a walked path with a Catmull-Rom curve, so it reads as a smooth line
// instead of a jagged GPS trace. The curve still passes through every recorded point.
export function smooth(points: LngLat[], steps = 6): LngLat[] {
  const pts = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
  if (pts.length < 3) return pts;
  const out: LngLat[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k: 0 | 1) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  return out;
}

// Same colours for the same person everywhere on the map. The first slot is left for you.
export const PERSON_COLORS = ['#FF6B4A', '#33AEEA', '#9CBF6B', '#F2B84B', '#B07CE8', '#2FBF9B'];
