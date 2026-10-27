const root = document.querySelector<HTMLElement>('[data-loom]');
if (root) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a[data-work]')];
  const nodes = [...root.querySelectorAll<SVGCircleElement>('[data-node]')];
  const strands = [...root.querySelectorAll<SVGPathElement>('.cx-strand')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const wefts = [...root.querySelectorAll<HTMLButtonElement>('[data-topic]')];
  const wide = window.matchMedia('(min-width: 900px)');
  let selected = '';

  root.classList.add('is-live');

  const mark = (id: string, state: 'selected' | 'related' | 'dim' | '') => {
    for (const element of [...links.filter((link) => link.dataset.work === id), ...nodes.filter((node) => node.dataset.node === id)]) {
      element.classList.toggle('is-selected', state === 'selected');
      element.classList.toggle('is-related', state === 'related');
      element.classList.toggle('is-dim', state === 'dim');
    }
  };
  const ids = [...new Set(links.map((link) => link.dataset.work!))];

  const show = (key: string) => {
    selected = key;
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== key; });
    root.dataset.mode = key ? (key.startsWith('topic:') ? 'topic' : 'work') : '';
    links.forEach((link) => link.setAttribute('aria-current', String(link.dataset.work === key)));
    wefts.forEach((weft) => weft.setAttribute('aria-pressed', String(key.startsWith('topic:') ? `topic:${weft.dataset.topic}` === key : !key && !weft.dataset.topic)));
    if (!key) { ids.forEach((id) => mark(id, '')); strands.forEach((strand) => strand.classList.remove('is-on', 'is-dim')); return; }
    if (key.startsWith('topic:')) {
      const members = new Set(wefts.find((weft) => `topic:${weft.dataset.topic}` === key)?.dataset.members?.split(' '));
      ids.forEach((id) => mark(id, members.has(id) ? 'related' : 'dim'));
      strands.forEach((strand) => {
        const on = members.has(strand.dataset.from!) && members.has(strand.dataset.to!);
        strand.classList.toggle('is-on', on);
        strand.classList.toggle('is-dim', !on);
      });
      return;
    }
    const neighbours = new Set<string>();
    strands.forEach((strand) => {
      const on = strand.dataset.from === key || strand.dataset.to === key;
      if (on) { neighbours.add(strand.dataset.from!); neighbours.add(strand.dataset.to!); }
      strand.classList.toggle('is-on', on);
      strand.classList.toggle('is-dim', !on);
    });
    ids.forEach((id) => mark(id, id === key ? 'selected' : neighbours.has(id) ? 'related' : 'dim'));
  };

  // 宽屏：第一次点选中查看联系，再点一次才打开；窄屏没有图，直接打开。
  links.forEach((link) => link.addEventListener('click', (event) => {
    if (!wide.matches || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (selected === link.dataset.work) return;
    event.preventDefault();
    show(link.dataset.work!);
  }));
  wefts.forEach((weft) => weft.addEventListener('click', () => show(weft.dataset.topic ? `topic:${weft.dataset.topic}` : '')));
  root.addEventListener('keydown', (event) => { if (event.key === 'Escape' && selected) show(''); });
  show('');
}
