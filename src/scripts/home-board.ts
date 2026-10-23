import { boardRibbonPath, boardRibbons } from '../lib/home-board';

const root = document.querySelector<HTMLElement>('[data-opening-board]');
if (root) {
  const toggle = root.querySelector<HTMLButtonElement>('[data-board-toggle]');
  const paths = [...root.querySelectorAll<SVGPathElement>('[data-board-ribbon]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-board-card]')].map((element) => ({
    element,
    rot: Number(element.dataset.rot),
    ax: Number(element.dataset.ax),
    ay: Number(element.dataset.ay),
    ar: Number(element.dataset.ar),
    speed: Number(element.dataset.speed),
    phase: Number(element.dataset.phase),
    held: false,
    frozenAt: 0,
    offset: 0,
  }));
  let paused = false;
  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  let lastPaint = -Infinity;

  const draw = (time: number) => {
    paths.forEach((path, index) => path.setAttribute('d', boardRibbonPath(boardRibbons[index], time)));
    cards.forEach((card) => {
      if (card.held) return;
      const t = (time - card.offset) / 1000;
      const speed = Math.PI * 2 / card.speed;
      const x = card.ax * Math.sin(t * speed + card.phase);
      const y = card.ay * Math.cos(t * speed * .83 + card.phase * 1.7);
      const rotation = card.rot + card.ar * Math.sin(t * speed * .57 + card.phase * .6);
      card.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
    });
  };
  const canRun = () => visible && !paused && !reduced.matches && !document.hidden;
  const tick = (time: number) => {
    frame = 0;
    if (!canRun()) return;
    elapsed += previous ? Math.min(time - previous, 100) : 0;
    previous = time;
    if (time - lastPaint >= 1000 / 30) { draw(elapsed); lastPaint = time; }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (toggle) {
      toggle.hidden = reduced.matches;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? '动' : '停';
      toggle.setAttribute('aria-label', paused ? '继续台面动画' : '暂停台面动画');
    }
    if (canRun()) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (reduced.matches) { elapsed = 0; draw(0); }
    }
  };

  cards.forEach((card) => {
    const hold = () => {
      card.held = true;
      card.frozenAt = elapsed;
      card.element.classList.add('is-held');
    };
    const release = () => {
      card.held = false;
      card.offset += elapsed - card.frozenAt;
      card.element.classList.remove('is-held');
      draw(elapsed);
      sync();
    };
    card.element.addEventListener('pointerenter', hold);
    card.element.addEventListener('pointerleave', release);
    card.element.addEventListener('focus', hold);
    card.element.addEventListener('blur', release);
  });

  toggle?.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(root);
  draw(0);
  sync();
}
