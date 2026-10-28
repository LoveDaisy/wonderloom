// 首屏「绕线板」的几何：圆周上 N 枚钉子，第 n 枚连到第 k·n 枚。
// 直线族的包络是 k−1 个尖点的外摆线（k=2 心脏线，k=3 肾形线）。

export const PEGS = 200;
export const START = Math.PI;

export const pegAngle = (index: number) => START + index * 2 * Math.PI / PEGS;

// 第 n 根线两端的角度；k 可以取非整数，图形在整数之间连续变化。
export function threadEnds(index: number, k: number): [number, number] {
  return [pegAngle(index), START + k * index * 2 * Math.PI / PEGS];
}

export function curveName(k: number) {
  const n = Math.round(k);
  if (Math.abs(k - n) > .02) return null;
  if (n === 2) return '心脏线';
  if (n === 3) return '肾形线';
  return `${n - 1} 个尖点的外摆线`;
}

// 无脚本时的静态图：k = 2，路径直接写进 SVG。
export function staticThreads(k: number, radius: number, center: number) {
  return Array.from({ length: PEGS }, (_, index) => {
    const [a, b] = threadEnds(index, k);
    return `M${(center + radius * Math.cos(a)).toFixed(1)} ${(center + radius * Math.sin(a)).toFixed(1)}L${(center + radius * Math.cos(b)).toFixed(1)} ${(center + radius * Math.sin(b)).toFixed(1)}`;
  }).join('');
}
