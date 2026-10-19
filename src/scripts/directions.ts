const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

// Content remains visible without JavaScript; only the entrance animation is optional.
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!motionPreference.matches) entry.target.animate(
      [{ opacity: 0.25, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

const observation = document.querySelector<HTMLElement>('[data-observation]');
if (observation) {
  const plates = [...observation.querySelectorAll<HTMLElement>('[data-plate]')];
  const controls = observation.querySelector<HTMLElement>('.observation-controls');
  const buttons = [...observation.querySelectorAll<HTMLButtonElement>('[data-observation-select]')];
  const select = (index: number) => {
    plates.forEach((plate, i) => { plate.hidden = i !== index; });
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    observation.dataset.active = String(index);
    if (!motionPreference.matches) plates[index]?.animate(
      [{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:450,easing:'ease-out'},
    );
  };
  if (controls) controls.hidden = false;
  observation.classList.add('is-interactive');
  select(0);
  buttons.forEach((button,index) => button.addEventListener('click',() => select(index)));
}

const loom = document.querySelector<HTMLElement>('[data-loom]');
const weaveButton = loom?.querySelector<HTMLButtonElement>('.weave-toggle');
if (loom && weaveButton) {
  weaveButton.hidden = false;
  weaveButton.addEventListener('click', () => {
    const changed = loom.classList.toggle('alternate-weave');
    weaveButton.setAttribute('aria-pressed', String(changed));
  });
}

motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) document.getAnimations().forEach(animation => animation.cancel());
});
