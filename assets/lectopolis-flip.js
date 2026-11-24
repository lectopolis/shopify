/* Lectópolis · Hero libro: paso de página entre banners. */
(() => {
  'use strict';
  const STRIPS = 6;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const instances = new Map();

  const ready = img => {
    if (!img) return Promise.resolve();
    if (img.loading === 'lazy') img.loading = 'eager';
    if (img.complete && img.naturalWidth) return Promise.resolve();
    const decoded = img.decode ? img.decode().catch(() => {}) : new Promise(r => img.addEventListener('load', r, { once: true }));
    return Promise.race([decoded, new Promise(r => setTimeout(r, 2500))]);
  };
  const srcOf = img => img.currentSrc || img.src;
  const make = (tag, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; return el; };
  const picture = (src, left) => {
    const img = make('img');
    img.src = src; img.alt = ''; img.decoding = 'sync'; img.draggable = false;
    img.style.left = left;
    return img;
  };

  /* Construye la escena: dos medias páginas fijas y una hoja de tiras anidadas. */
  function buildStage(fromSrc, toSrc, dir) {
    const next = dir === 'next';
    const stage = make('div', `lp-flip__stage lp-flip__stage--${dir}`);
    stage.setAttribute('aria-hidden', 'true');
    stage.style.setProperty('--lp-strips', STRIPS);

    const left = make('div', 'lp-flip__half lp-flip__half--left');
    const right = make('div', 'lp-flip__half lp-flip__half--right');
    // Siguiente: la izquierda sigue mostrando el banner actual (se cubre), la derecha ya muestra el nuevo (se descubre).
    left.append(picture(next ? fromSrc : toSrc, '0'));
    right.append(picture(next ? toSrc : fromSrc, '-100%'));
    (next ? left : right).classList.add('lp-flip__half--cover');
    (next ? right : left).classList.add('lp-flip__half--reveal');
    stage.append(left, right, make('div', 'lp-flip__spine'));

    let parent = stage;
    for (let k = 0; k < STRIPS; k++) {
      const strip = make('div', `lp-flip__strip${k === 0 ? ' lp-flip__leaf' : ''}${k === STRIPS - 1 ? ' lp-flip__strip--tip' : ''}`);
      const front = make('div', 'lp-flip__face lp-flip__face--front');
      const back = make('div', 'lp-flip__face lp-flip__face--back');
      // Desplazamientos en múltiplos del ancho de una tira (el libro mide 2 × STRIPS tiras).
      const frontOffset = next ? STRIPS + k : STRIPS - k - 1;
      const backOffset = next ? STRIPS - k - 1 : STRIPS + k;
      front.append(picture(fromSrc, `-${frontOffset * 100}%`));
      back.append(picture(toSrc, `-${backOffset * 100}%`));
      strip.style.setProperty('--k', k);
      strip.append(front, back);
      parent.append(strip);
      parent = strip;
    }
    return stage;
  }

  function mount(root) {
    if (instances.has(root)) return;
    const book = root.querySelector('[data-lp-flip-book]');
    const slides = [...root.querySelectorAll('[data-lp-flip-slide]')];
    if (!book || slides.length < 2) return;
    const dots = [...root.querySelectorAll('[data-lp-flip-dot]')];
    const pauseBtn = root.querySelector('[data-lp-flip-pause]');
    const autoplay = root.dataset.autoplay === 'true';
    const interval = Number(root.dataset.interval) || 6000;
    const duration = Number(root.dataset.duration) || 1400;
    root.style.setProperty('--lp-flip-interval', `${interval}ms`);
    if (autoplay) root.classList.add('lp-flip--autoplay');

    let current = 0, busy = false, timer = 0, remaining = interval, startedAt = 0;
    let userPaused = false, hover = false, focus = false, visible = true;

    const isPaused = () => userPaused || hover || focus || !visible || document.hidden;

    const setActive = index => {
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle('is-active', on);
        slide.toggleAttribute('aria-hidden', !on);
        slide.querySelectorAll('a').forEach(a => on ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1'));
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        i === index ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current');
      });
      current = index;
    };

    const schedule = () => {
      clearTimeout(timer);
      if (!autoplay || isPaused()) return;
      startedAt = performance.now();
      timer = setTimeout(() => { remaining = interval; go(current + 1, 'next'); }, remaining);
    };
    const updatePause = () => {
      const paused = isPaused();
      root.classList.toggle('lp-flip--paused', paused);
      if (paused) {
        if (timer) { clearTimeout(timer); timer = 0; remaining = Math.max(400, remaining - (performance.now() - startedAt)); }
      } else if (!timer && !busy) schedule();
    };

    async function go(target, dir) {
      if (busy) return;
      const to = (target + slides.length) % slides.length;
      if (to === current) return;
      busy = true;
      clearTimeout(timer); timer = 0;
      const fromImg = slides[current].querySelector('img');
      const toImg = slides[to].querySelector('img');
      await ready(toImg);

      if (reduced.matches || !fromImg || !toImg) {
        root.classList.add('lp-flip--fade');
        setActive(to);
      } else {
        root.classList.remove('lp-flip--fade');
        const stage = buildStage(srcOf(fromImg), srcOf(toImg), dir);
        book.append(stage);
        // Espera a que las copias estén decodificadas para que no parpadee.
        await Promise.all([...stage.querySelectorAll('img')].slice(0, 3).map(i => i.decode ? i.decode().catch(() => {}) : null));
        setActive(to);
        await new Promise(resolve => {
          const leaf = stage.querySelector('.lp-flip__leaf');
          const done = () => { clearTimeout(fallback); resolve(); };
          const fallback = setTimeout(done, duration + 300);
          leaf.addEventListener('animationend', e => { if (e.target === leaf) done(); });
        });
        stage.remove();
      }
      busy = false;
      // La barra del punto empezó al cambiar de banner: descuenta lo que duró el paso de página.
      remaining = reduced.matches ? interval : Math.max(1000, interval - duration);
      // Precarga el siguiente banner en segundo plano.
      ready(slides[(current + 1) % slides.length].querySelector('img'));
      updatePause();
      if (!isPaused()) schedule();
    }

    const next = () => go(current + 1, 'next');
    const prev = () => go(current - 1, 'prev');
    const onNext = () => { remaining = interval; next(); };
    const onPrev = () => { remaining = interval; prev(); };
    const onDot = e => {
      const i = Number(e.currentTarget.dataset.lpFlipDot);
      remaining = interval;
      go(i, i > current ? 'next' : 'prev');
    };
    const onPause = () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Reanudar el pase automático' : 'Pausar el pase automático');
      updatePause();
    };
    const onKey = e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
    };

    // Deslizar con el dedo o el ratón.
    let downX = null, downY = 0, swiped = false;
    const onDown = e => { if (e.button !== 0) return; downX = e.clientX; downY = e.clientY; swiped = false; };
    const onUp = e => {
      if (downX === null) return;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      downX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; dx < 0 ? onNext() : onPrev(); }
    };
    const onClick = e => { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; } };

    const onEnter = e => { if (e.pointerType === 'mouse') { hover = true; updatePause(); } };
    const onLeave = () => { hover = false; updatePause(); };
    const onFocusIn = () => { focus = true; updatePause(); };
    const onFocusOut = e => { if (!root.contains(e.relatedTarget)) { focus = false; updatePause(); } };
    const onVisibility = () => updatePause();
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updatePause(); }, { threshold: 0.25 });

    root.querySelector('[data-lp-flip-next]')?.addEventListener('click', onNext);
    root.querySelector('[data-lp-flip-prev]')?.addEventListener('click', onPrev);
    dots.forEach(d => d.addEventListener('click', onDot));
    pauseBtn?.addEventListener('click', onPause);
    root.addEventListener('keydown', onKey);
    book.addEventListener('pointerdown', onDown);
    book.addEventListener('pointerup', onUp);
    book.addEventListener('click', onClick, true);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);
    observer.observe(root);

    // Precarga el segundo banner cuando la página ya terminó de cargar.
    const warm = () => ready(slides[1].querySelector('img'));
    document.readyState === 'complete' ? setTimeout(warm, 1200) : addEventListener('load', () => setTimeout(warm, 1200), { once: true });
    updatePause();
    schedule();

    instances.set(root, () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      instances.delete(root);
    });
  }

  const scan = scope => scope.querySelectorAll('[data-lp-flip]').forEach(mount);
  scan(document);
  document.addEventListener('shopify:section:load', e => scan(e.target));
  document.addEventListener('shopify:section:unload', e => e.target.querySelectorAll('[data-lp-flip]').forEach(r => instances.get(r)?.()));
  document.addEventListener('shopify:block:select', e => {
    const root = e.target.closest('[data-lp-flip]');
    if (!root) return;
    const slides = [...root.querySelectorAll('[data-lp-flip-slide]')];
    const i = slides.indexOf(e.target);
    if (i >= 0) root.querySelectorAll('[data-lp-flip-dot]')[i]?.click();
  });
})();
