document.querySelectorAll<HTMLElement>('[data-connections]').forEach(root => {
  const selector = root.querySelector<HTMLElement>('[data-connection-selector]');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-work-select]'));
  const details = Array.from(root.querySelectorAll<HTMLDetailsElement>('[data-work-detail]'));
  const status = root.querySelector<HTMLElement>('[data-connection-status]');
  if (!selector || !buttons.length || !details.length) return;
  const edges = Array.from(root.querySelectorAll<SVGLineElement>('line[data-from]'));
  const select = (id: string, announce = true) => {
    const active = details.find(detail => detail.dataset.workDetail === id);
    if (!active) return;
    const connected = new Set<string>([id]);
    edges.forEach(edge => {
      const related = edge.dataset.from === id || edge.dataset.to === id;
      edge.classList.toggle('is-connected', related);
      if (related) {
        if (edge.dataset.from) connected.add(edge.dataset.from);
        if (edge.dataset.to) connected.add(edge.dataset.to);
      }
    });
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.workSelect === id));
      button.classList.toggle('is-neighbour', connected.has(button.dataset.workSelect ?? ''));
    });
    details.forEach(detail => { detail.hidden = detail !== active; detail.open = detail === active; });
    if (status) status.textContent = announce ? `${active.querySelector('h3')?.textContent} · ${active.querySelectorAll('li').length} 个直接关联` : '';
  };
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.workSelect!)));
  select('project:lumice', false);
  root.dataset.enhanced = 'true';
  selector.hidden = false;
});
