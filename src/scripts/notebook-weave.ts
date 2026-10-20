import { threadPath } from '../lib/loom-threads';

// Animate only this small drawing; scrolling never controls its shape or timing.
document.querySelectorAll<HTMLElement>('[data-notebook-weave]').forEach(root => {
  const button = root.querySelector<HTMLButtonElement>('[data-weave-toggle]');
  if (!button) return;
  const paths = [...root.querySelectorAll<SVGPathElement>('[data-weave-axis]')].map(path => ({
    path,
    index: Number(path.dataset.weaveIndex),
    axis: path.dataset.weaveAxis as 'warp' | 'weft',
  }));
  const groups = [...root.querySelectorAll<SVGGElement>('[data-weave-group]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReduced = reduced.matches;
  let paused = false;
  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;
  let lastPaint = -Infinity;

  const draw = (time: number) => {
    const warpPhase = time * Math.PI * 2 / 18000;
    const weftPhase = time * Math.PI * 2 / 23000;
    const warp = .28 * (1 - Math.cos(warpPhase));
    const weft = .26 * (1 - Math.cos(weftPhase));
    paths.forEach(({ path, index, axis }) => {
      path.setAttribute('d', threadPath(index, axis, axis === 'warp' ? warp : weft));
    });
    groups.forEach(group => {
      const angle = group.dataset.weaveGroup === 'warp'
        ? 3 * Math.sin(weftPhase)
        : -3 * Math.sin(warpPhase);
      group.setAttribute('transform', `rotate(${angle} 300 300)`);
    });
  };
  const canRun = () => visible && !paused && !prefersReduced && !document.hidden;
  const tick = (time: number) => {
    frame = 0;
    if (!canRun()) return;
    elapsed += previousTime ? Math.min(time - previousTime, 100) : 0;
    previousTime = time;
    if (time - lastPaint >= 1000 / 30) {
      draw(elapsed);
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    button.hidden = prefersReduced;
    button.setAttribute('aria-pressed', String(paused));
    const label = paused ? '播放头图动画' : '暂停头图动画';
    button.setAttribute('aria-label', label);
    button.title = label;
    if (canRun()) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (prefersReduced) {
        elapsed = 0;
        draw(0);
      }
    }
  };
  button.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', event => { prefersReduced = event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(root);
  sync();
});
