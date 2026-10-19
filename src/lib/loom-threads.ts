type Axis = 'warp' | 'weft';

// Abstract artwork, not a model of light paths. Equal-length Bézier control
// points let one continuous thread drawing change with the chapter position.
export function threadPath(index: number, axis: Axis, progress: number) {
  const i = index;
  const frames = axis === 'warp' ? [
    [95+i*14,-20, 65+i*14,180, 510-i*8,130, 480-i*14,300, 450-i*13,460, 190+i*12,410, 220+i*13,620],
    [80+i*6,-20, 70+i*6,160, 440-i*5,120, 430-i*5,300, 420-i*5,480, 100+i*6,450, 100+i*6,620],
    [140+i*20,-20, 140+i*20,140, 140+i*20,200, 140+i*20,300, 140+i*20,400, 140+i*20,480, 140+i*20,620],
  ] : [
    [-20,350+i*12, 170,390+i*10, 120,95+i*12, 300,120+i*13, 460,145+i*14, 460,350+i*10, 620,280+i*12],
    [-20,420+i*6, 150,420+i*6, 150,90+i*6, 300,90+i*6, 450,90+i*6, 450,420+i*6, 620,420+i*6],
    [-20,180+i*17, 150,180+i*17, 220,180+i*17, 300,180+i*17, 380,180+i*17, 450,180+i*17, 620,180+i*17],
  ];
  const p = Math.max(0, Math.min(2, progress));
  const frame = Math.min(1, Math.floor(p));
  const fraction = p - frame;
  const t = fraction * fraction * (3 - 2 * fraction);
  const v = frames[frame].map((value, j) => (value + (frames[frame+1][j] - value) * t).toFixed(2));
  return `M${v[0]} ${v[1]} C${v.slice(2,8).join(' ')} C${v.slice(8).join(' ')}`;
}
