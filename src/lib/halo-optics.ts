// 首屏实时计算的光学部分：六角冰晶二维截面里的光线追踪与光谱累加。
// 只依赖纯函数，绘制与交互在 scripts/halo-plate.ts。

export type Vec = [number, number];

// 冰的折射率：Cauchy 近似，拟合 400 nm ≈ 1.3194、589 nm ≈ 1.3094、700 nm ≈ 1.3069。
export const iceIndex = (nm: number) => 1.3008 + 2969 / (nm * nm);

export function hexagon(cx: number, cy: number, radius: number, theta: number): Vec[] {
  return Array.from({ length: 6 }, (_, k) => [cx + radius * Math.cos(theta + k * Math.PI / 3), cy + radius * Math.sin(theta + k * Math.PI / 3)] as Vec);
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];

function refract(d: Vec, normal: Vec, eta: number): Vec | null {
  const cosi = -dot(d, normal);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  const f = eta * cosi - Math.sqrt(k);
  return [eta * d[0] + f * normal[0], eta * d[1] + f * normal[1]];
}

const reflect = (d: Vec, normal: Vec): Vec => {
  const f = 2 * dot(d, normal);
  return [d[0] - f * normal[0], d[1] - f * normal[1]];
};

// 射线与凸多边形各边求交，sign 决定只看迎面（-1，进入）还是背面（+1，离开）的边。
function hit(poly: Vec[], center: Vec, o: Vec, d: Vec, sign: 1 | -1) {
  let best: { t: number; point: Vec; normal: Vec } | null = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const mid: Vec = [(a[0] + b[0]) / 2 - center[0], (a[1] + b[1]) / 2 - center[1]];
    const len = Math.hypot(mid[0], mid[1]);
    const normal: Vec = [mid[0] / len, mid[1] / len];
    if (sign * dot(d, normal) <= 0) continue;
    const e: Vec = [b[0] - a[0], b[1] - a[1]];
    const denom = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(denom) < 1e-12) continue;
    const w: Vec = [a[0] - o[0], a[1] - o[1]];
    const t = (w[0] * e[1] - w[1] * e[0]) / denom;
    const s = (w[0] * d[1] - w[1] * d[0]) / denom;
    if (t > 1e-9 && s >= 0 && s <= 1 && (!best || t < best.t)) best = { t, point: [o[0] + t * d[0], o[1] + t * d[1]], normal };
  }
  return best;
}

export type TraceResult = { points: Vec[]; exit: Vec } | null;

// 只追踪透射：入射面折射，内部遇全反射则反射，最多 6 次。
export function trace(poly: Vec[], center: Vec, origin: Vec, direction: Vec, n: number): TraceResult {
  const entry = hit(poly, center, origin, direction, -1);
  if (!entry) return null;
  let d = refract(direction, entry.normal, 1 / n);
  if (!d) return null;
  let o = entry.point;
  const points: Vec[] = [origin, o];
  for (let bounce = 0; bounce < 6; bounce++) {
    const wall = hit(poly, center, o, d, 1);
    if (!wall) return null;
    points.push(wall.point);
    const inward: Vec = [-wall.normal[0], -wall.normal[1]];
    const out = refract(d, inward, n);
    if (out) return { points, exit: out };
    d = reflect(d, inward);
    o = wall.point;
  }
  return null;
}

export const deviation = (exit: Vec) => Math.atan2(Math.abs(exit[1]), exit[0]) * 180 / Math.PI;

// CIE 1931 色匹配函数的多瓣高斯拟合（Wyman, Sloan & Shirley 2013）。
const lobe = (x: number, mu: number, s1: number, s2: number) => {
  const t = (x - mu) / (x < mu ? s1 : s2);
  return Math.exp(-.5 * t * t);
};
export function cieXYZ(nm: number): [number, number, number] {
  return [
    1.056 * lobe(nm, 599.8, 37.9, 31.0) + .362 * lobe(nm, 442.0, 16.0, 26.7) - .065 * lobe(nm, 501.1, 20.4, 26.2),
    .821 * lobe(nm, 568.8, 46.9, 40.5) + .286 * lobe(nm, 530.9, 16.3, 31.1),
    1.217 * lobe(nm, 437.0, 11.8, 36.0) + .681 * lobe(nm, 459.0, 26.0, 13.8),
  ];
}
// 太阳近似为 5800 K 黑体，相对权重。
export function sunWeight(nm: number) {
  const m = nm * 1e-9;
  return 1 / (Math.pow(m / 560e-9, 5) * (Math.exp(1.4388e-2 / (m * 5800)) - 1));
}
export function xyzToLinearSrgb(x: number, y: number, z: number): [number, number, number] {
  return [3.2406 * x - 1.5372 * y - .4986 * z, -.9689 * x + 1.8758 * y + .0415 * z, .0557 * x - .204 * y + 1.057 * z];
}
export const encodeSrgb = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055;
};

export const BIN_WIDTH = .1;
export const BIN_COUNT = 1800;

// 偏折角直方图：每个 0.1° 一格，按 XYZ 三通道累加日光能量。
export class DeviationHistogram {
  readonly xyz = new Float64Array(BIN_COUNT * 3);
  traced = 0;
  sample(count: number, random = Math.random) {
    const center: Vec = [0, 0];
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI / 3;
      const poly = hexagon(0, 0, 1, theta);
      const y = (random() * 2 - 1);
      const nm = 400 + random() * 300;
      this.traced++;
      const result = trace(poly, center, [-3, y], [1, 0], iceIndex(nm));
      if (!result) continue;
      const bin = Math.floor(deviation(result.exit) / BIN_WIDTH);
      if (bin < 0 || bin >= BIN_COUNT) continue;
      const [x, yy, z] = cieXYZ(nm);
      const w = sunWeight(nm);
      this.xyz[bin * 3] += x * w;
      this.xyz[bin * 3 + 1] += yy * w;
      this.xyz[bin * 3 + 2] += z * w;
    }
  }
  // 跳过近 0° 的直透光（平行面穿过），找出最亮的偏折角。
  peak(from = 5) {
    let best = -1, value = 0;
    for (let bin = Math.round(from / BIN_WIDTH); bin < BIN_COUNT; bin++) {
      const y = this.xyz[bin * 3 + 1];
      if (y > value) { value = y; best = bin; }
    }
    return best < 0 ? null : { angle: (best + .5) * BIN_WIDTH, value };
  }
}
