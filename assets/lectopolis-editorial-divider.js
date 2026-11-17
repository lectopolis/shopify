(() => {
  'use strict';
  const key = '__lectopolisEditorialMotion';
  if (window[key]) { window[key].scan(document); return; }
  const roots = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let frame = 0;
  const clamp = value => Math.max(-1, Math.min(1, value));
  const reset = state => {
    ['--lp-divider-scroll', '--lp-divider-x', '--lp-divider-y'].forEach(name => state.surface.style.removeProperty(name));
    state.surface.style.willChange = 'auto';
  };
  const draw = () => {
    frame = 0;
    if (reduced.matches) return;
    roots.forEach((state, root) => {
      if (!state.visible) return;
      const rect = root.getBoundingClientRect();
      const position = clamp((innerHeight * 0.5 - rect.top - rect.height * 0.5) / innerHeight);
      state.surface.style.setProperty('--lp-divider-scroll', `${(position * 1.5).toFixed(3)}deg`);
      state.surface.style.setProperty('--lp-divider-x', `${(-state.y * 1.8).toFixed(3)}deg`);
      state.surface.style.setProperty('--lp-divider-y', `${(state.x * 1.8).toFixed(3)}deg`);
      state.surface.style.willChange = 'transform';
    });
  };
  const schedule = () => { if (!frame && !reduced.matches) frame = requestAnimationFrame(draw); };
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const state = roots.get(entry.target);
    if (!state) return;
    state.visible = entry.isIntersecting;
    if (!state.visible) reset(state);
    schedule();
  }), { rootMargin: '100px' });
  function mount(root) {
    if (roots.has(root) || root.dataset.lpEditorialMotion === 'false') return;
    const surface = root.querySelector('.lp-editorial-divider__surface');
    if (!surface) return;
    const state = { surface, visible: false, x: 0, y: 0 };
    state.move = event => {
      if (reduced.matches || !fine.matches || event.pointerType === 'touch') return;
      const rect = root.getBoundingClientRect();
      state.x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      state.y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2);
      schedule();
    };
    state.leave = () => { state.x = 0; state.y = 0; schedule(); };
    root.addEventListener('pointermove', state.move, { passive: true });
    root.addEventListener('pointerleave', state.leave);
    roots.set(root, state);
    observer.observe(root);
  }
  function scan(container) {
    if (container.matches?.('[data-lp-editorial-motion]')) mount(container);
    container.querySelectorAll('[data-lp-editorial-motion]').forEach(mount);
  }
  window[key] = { scan };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame); frame = 0;
    roots.forEach(reset); schedule();
  });
  document.addEventListener('shopify:section:load', event => scan(event.target));
  document.addEventListener('shopify:section:unload', event => roots.forEach((state, root) => {
    if (!event.target.contains(root)) return;
    observer.unobserve(root);
    root.removeEventListener('pointermove', state.move);
    root.removeEventListener('pointerleave', state.leave);
    roots.delete(root);
  }));
  scan(document);
})();
