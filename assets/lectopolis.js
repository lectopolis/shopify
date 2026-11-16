(() => {
  'use strict';
  const instances = new Map();
  function mount(root) {
    if (instances.has(root)) return;
    const scene = root.querySelector('[data-lp-scene]');
    if (!scene) return;
    const books = [...scene.querySelectorAll('[data-lp-book]')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let active = true;
    const draw = () => {
      frame = 0;
      if (motion.matches) return;
      const rect = scene.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (window.innerHeight * 0.45 - rect.top - rect.height * 0.4) / window.innerHeight));
      books.forEach(book => {
        const depth = Number(book.dataset.lpBook);
        book.style.setProperty('--lp-y', `${(progress * depth * 125).toFixed(2)}px`);
        book.style.setProperty('--lp-turn', `${(progress * depth * 20).toFixed(2)}deg`);
      });
    };
    const schedule = () => { if (!frame && active && !motion.matches) frame = requestAnimationFrame(draw); };
    const change = () => {
      books.forEach(book => {
        book.style.removeProperty('--lp-y');
        book.style.removeProperty('--lp-turn');
      });
      schedule();
    };
    const observer = new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      if (active) schedule();
    }, { rootMargin: '100px' });
    observer.observe(scene);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    motion.addEventListener('change', change);
    schedule();
    instances.set(root, () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', change);
      instances.delete(root);
    });
  }
  document.querySelectorAll('[data-lp-home]').forEach(mount);
  document.addEventListener('shopify:section:load', event => event.target.querySelectorAll('[data-lp-home]').forEach(mount));
  document.addEventListener('shopify:section:unload', event => {
    event.target.querySelectorAll('[data-lp-home]').forEach(root => instances.get(root)?.());
  });
})();
