import { PEGS, curveName, pegAngle, threadEnds } from '../lib/curve-stitch';

const root = document.querySelector<HTMLElement>('[data-stitch-board]');
if (root) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const slider = root.querySelector<HTMLInputElement>('[data-stitch-k]')!;
  const value = root.querySelector<HTMLElement>('[data-stitch-value]')!;
  const name = root.querySelector<HTMLElement>('[data-stitch-name]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-stitch-toggle]')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const style = getComputedStyle(root);
  const ink = style.getPropertyValue('--cy-prussian-ink').trim() || '#234a73';
  const red = style.getPropertyValue('--cy-vermilion').trim() || '#b5412f';
  const faint = 'rgba(26, 34, 48, .5)';
  const mono = `10px ${style.getPropertyValue('--cy-mono').trim() || 'Menlo, monospace'}`;

  const hex = (colour: string) => [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
  const [a, b] = [hex(ink), hex(red)];
  // 线色沿钉序在靛与朱之间往复，重叠处自然变深，包络因此显形。
  const colours = Array.from({ length: PEGS }, (_, i) => {
    const t = .5 - .5 * Math.cos(2 * Math.PI * i / PEGS);
    return `rgba(${a.map((v, c) => Math.round(v + (b[c] - v) * t)).join(',')}, .3)`;
  });

  // 在整数 k 处停留，整数之间缓慢过渡：2 → 3 → … → 6 → … → 2。
  const stops = [2, 3, 4, 5, 6, 5, 4, 3];
  const DWELL = 4200, TRAVEL = 4800, LEG = DWELL + TRAVEL;
  const kAt = (time: number) => {
    const t = time % (LEG * stops.length);
    const leg = Math.floor(t / LEG), within = t - leg * LEG;
    const from = stops[leg], to = stops[(leg + 1) % stops.length];
    if (within < DWELL) return from;
    const s = (within - DWELL) / TRAVEL;
    return from + (to - from) * (s * s * (3 - 2 * s));
  };

  let size = 0, ratio = 1, context = canvas.getContext('2d')!;
  let k = 2, elapsed = 0, previous = 0, frame = 0, lastPaint = -Infinity;
  let paused = false, visible = false;
  const plucks = new Float32Array(PEGS);
  const pluckedAt = new Float32Array(PEGS).fill(-1e9);
  let now = 0;

  root.classList.add('is-live');

  const fit = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.getBoundingClientRect().width;
    canvas.width = canvas.height = Math.max(1, Math.round(size * ratio));
    context = canvas.getContext('2d')!;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const geometry = () => ({ c: size / 2, r: size / 2 - 34 });
  const point = (angle: number) => { const { c, r } = geometry(); return [c + r * Math.cos(angle), c + r * Math.sin(angle)] as const; };

  function draw() {
    const ctx = context, { c, r } = geometry();
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = .8;
    for (let i = 0; i < PEGS; i++) {
      const [from, to] = threadEnds(i, k);
      const [x1, y1] = point(from), [x2, y2] = point(to);
      ctx.strokeStyle = colours[i];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const age = (now - pluckedAt[i]) / 1000;
      const amplitude = plucks[i] * Math.exp(-age / .9);
      if (Math.abs(amplitude) > .15) {
        const length = Math.hypot(x2 - x1, y2 - y1) || 1;
        const offset = 2 * amplitude * Math.sin(2 * Math.PI * 4 * age);
        ctx.quadraticCurveTo((x1 + x2) / 2 - (y2 - y1) / length * offset, (y1 + y2) / 2 + (x2 - x1) / length * offset, x2, y2);
      } else ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    // 钉圈与刻度：每 10 枚一短刻，每 50 枚一长刻并标号。
    ctx.strokeStyle = 'rgba(26, 34, 48, .35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(c, c, r + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < PEGS; i += 10) {
      const angle = pegAngle(i), long = i % 50 === 0;
      ctx.moveTo(c + (r + 7) * Math.cos(angle), c + (r + 7) * Math.sin(angle));
      ctx.lineTo(c + (r + (long ? 16 : 12)) * Math.cos(angle), c + (r + (long ? 16 : 12)) * Math.sin(angle));
    }
    ctx.stroke();
    ctx.fillStyle = faint;
    ctx.font = mono;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < PEGS; i += 50) {
      const angle = pegAngle(i);
      ctx.fillText(String(i), c + (r + 26) * Math.cos(angle), c + (r + 26) * Math.sin(angle));
    }
    ctx.fillStyle = 'rgba(26, 34, 48, .55)';
    for (let i = 0; i < PEGS; i++) {
      const [x, y] = point(pegAngle(i));
      ctx.fillRect(x - .9, y - .9, 1.8, 1.8);
    }
    value.textContent = k.toFixed(2);
    slider.value = k.toFixed(2);
    const label = curveName(k);
    name.textContent = label ?? '在两个整数之间';
    root.toggleAttribute('data-named', !!label);
  }

  const canRun = () => visible && !reduced.matches && !document.hidden;
  const tick = (time: number) => {
    frame = 0;
    if (!canRun()) return;
    const delta = previous ? Math.min(time - previous, 100) : 0;
    previous = time;
    now = time;
    if (!paused) elapsed += delta;
    if (time - lastPaint >= 1000 / 30) {
      if (!paused) k = kAt(elapsed);
      draw();
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    toggle.hidden = reduced.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '继续' : '暂停';
    if (canRun()) { if (!frame) { previous = 0; frame = requestAnimationFrame(tick); } }
    else { cancelAnimationFrame(frame); frame = 0; }
  };

  // 指针划过线时拨动它：判断指针这一段位移是否与线段相交。
  let last: [number, number] | null = null;
  const crosses = (p: readonly number[], q: readonly number[], s: readonly number[], t: readonly number[]) => {
    const d = (q[0] - p[0]) * (t[1] - s[1]) - (q[1] - p[1]) * (t[0] - s[0]);
    if (!d) return 0;
    const u = ((s[0] - p[0]) * (t[1] - s[1]) - (s[1] - p[1]) * (t[0] - s[0])) / d;
    const v = ((s[0] - p[0]) * (q[1] - p[1]) - (s[1] - p[1]) * (q[0] - p[0])) / d;
    return u >= 0 && u <= 1 && v > .04 && v < .96 ? Math.sign(d) : 0;
  };
  canvas.addEventListener('pointermove', (event) => {
    if (reduced.matches) return;
    const box = canvas.getBoundingClientRect();
    const here: [number, number] = [event.clientX - box.left, event.clientY - box.top];
    if (last) {
      const speed = Math.hypot(here[0] - last[0], here[1] - last[1]);
      for (let i = 0; i < PEGS; i++) {
        const [from, to] = threadEnds(i, k);
        const side = crosses(last, here, point(from), point(to));
        if (side) { plucks[i] = side * Math.min(12, 3 + speed * .35); pluckedAt[i] = performance.now(); }
      }
    }
    last = here;
  });
  canvas.addEventListener('pointerleave', () => { last = null; });

  slider.addEventListener('input', () => { paused = true; k = Number(slider.value); sync(); draw(); });
  toggle.addEventListener('click', () => {
    paused = !paused;
    // 从当前 k 接着走：把时间轴对齐到最近一次经过当前位置的时刻并不必要，直接从下一站出发。
    if (!paused) { const nearest = stops.findIndex((stop) => stop === Math.round(k)); elapsed = Math.max(0, nearest) * LEG; k = kAt(elapsed); }
    sync();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) { k = 2; draw(); } sync(); });
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(() => { fit(); draw(); }).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(root);
  fit();
  draw();
  sync();
}
