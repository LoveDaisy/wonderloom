import { threadPath } from '../lib/loom-threads';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

// Native scrolling is untouched. Only the explicit weave button animates art.
const paletteControls = [...document.querySelectorAll<HTMLButtonElement>('[data-palette-select]')];
const palettePreview = document.querySelector<HTMLElement>('.palette-preview');
function applyPalette(palette: string, changeUrl = false) {
  const selected = palette === 'moon' ? 'moon' : 'xiang';
  document.documentElement.dataset.palette = selected;
  paletteControls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paletteSelect === selected)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', selected === 'moon' ? '#edf3f4' : '#f6f2e4');
  if (changeUrl) {
    const url = new URL(window.location.href);
    if (selected === 'moon') url.searchParams.set('palette', selected);
    else url.searchParams.delete('palette');
    window.history.replaceState(window.history.state, '', url);
  }
}
if (palettePreview) palettePreview.hidden = false;
paletteControls.forEach(button => button.addEventListener('click', () => applyPalette(button.dataset.paletteSelect ?? 'xiang', true)));
if (palettePreview) {
  window.addEventListener('popstate', () => applyPalette(new URLSearchParams(window.location.search).get('palette') ?? 'xiang'));
  applyPalette(document.documentElement.dataset.palette ?? 'xiang');
}

const paths = [...document.querySelectorAll<SVGPathElement>('[data-thread-axis]')];
const weaveButton = document.querySelector<HTMLButtonElement>('.weave-toggle');
let weavePosition = 0;
let weaveTarget = 0;
let weaveFrame = 0;
function drawWeave(position: number) {
  weavePosition = position;
  paths.forEach(path => path.setAttribute('d', threadPath(Number(path.dataset.threadIndex), path.dataset.threadAxis as 'warp' | 'weft', position)));
}
if (weaveButton) {
  weaveButton.hidden = false;
  weaveButton.addEventListener('click', () => {
    window.cancelAnimationFrame(weaveFrame);
    weaveTarget = weaveTarget ? 0 : 1.35;
    weaveButton.setAttribute('aria-pressed', String(weaveTarget > 0));
    if (reduced.matches) { drawWeave(weaveTarget); return; }
    const from = weavePosition;
    const start = performance.now();
    const tick = (time: number) => {
      const t = Math.min(1, (time - start) / 800);
      const eased = t * t * (3 - 2 * t);
      drawWeave(from + (weaveTarget - from) * eased);
      if (t < 1) weaveFrame = window.requestAnimationFrame(tick);
    };
    weaveFrame = window.requestAnimationFrame(tick);
  });
}
reduced.addEventListener('change', () => {
  if (reduced.matches) { window.cancelAnimationFrame(weaveFrame); drawWeave(weaveTarget); }
});
