const article = document.querySelector<HTMLElement>('.article-prose');
const desktopLinks = [...document.querySelectorAll<HTMLAnchorElement>('.article-toc-desktop a[href^="#"]')];
if (article && desktopLinks.length) {
  const entries = desktopLinks.flatMap((link) => {
    const id = decodeURIComponent(link.hash.slice(1));
    const heading = document.getElementById(id);
    return heading ? [{ id, heading }] : [];
  });
  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('.article-toc a[href^="#"]')];
  let scheduled = false;
  let active = '';

  const update = () => {
    scheduled = false;
    const line = Math.min(window.innerHeight * .3, 260);
    const box = article.getBoundingClientRect();
    let next = '';
    if (box.top <= line && box.bottom > 0 && entries.length) {
      next = entries[0].id;
      for (const entry of entries) {
        if (entry.heading.getBoundingClientRect().top > line) break;
        next = entry.id;
      }
    }
    if (next === active) return;
    active = next;
    for (const link of tocLinks) {
      if (decodeURIComponent(link.hash.slice(1)) === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
}
