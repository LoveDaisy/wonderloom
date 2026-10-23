export type BoardRibbon = {
  dir: 'h' | 'v';
  pos: number;
  amp: number;
  phase: number;
  speed: number;
  width: number;
  axis: 'gold' | 'ink';
};

// 与 try/loom 的 DriftBoard 共用构图参数；这里保留一份正式页的权威路径算法。
export const boardRibbons: BoardRibbon[] = [
  ...Array.from({ length: 6 }, (_, index) => ({ dir: 'h' as const, pos: 70 + index * 92, amp: 58 + (index % 3) * 34, phase: index * 1.7, speed: 15 + index * 2.2, width: 8, axis: 'gold' as const })),
  ...Array.from({ length: 4 }, (_, index) => ({ dir: 'v' as const, pos: 80 + index * 150, amp: 44 + (index % 2) * 30, phase: .9 + index * 2.1, speed: 18 + index * 2.6, width: 5, axis: 'ink' as const })),
];

export function boardRibbonPath(ribbon: BoardRibbon, elapsedMs: number): string {
  const phase = elapsedMs / 1000 * Math.PI * 2 / ribbon.speed + ribbon.phase;
  const wave = (offset: number) => ribbon.amp * Math.sin(phase + offset);
  if (ribbon.dir === 'h') {
    const y = ribbon.pos;
    return `M -40 ${y} C 90 ${(y + wave(0)).toFixed(1)}, 190 ${(y - wave(1.1)).toFixed(1)}, 300 ${(y + wave(.6) * .5).toFixed(1)} S 470 ${(y - wave(1.6)).toFixed(1)}, 640 ${(y + wave(.4) * .5).toFixed(1)}`;
  }
  const x = ribbon.pos;
  return `M ${x} -40 C ${(x + wave(0)).toFixed(1)} 90, ${(x - wave(1.1)).toFixed(1)} 190, ${(x + wave(.6) * .5).toFixed(1)} 300 S ${(x - wave(1.6)).toFixed(1)} 470, ${(x + wave(.4) * .5).toFixed(1)} 640`;
}
