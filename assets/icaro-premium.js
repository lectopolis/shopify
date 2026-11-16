/* Ícaro Libros · interacciones premium (sin dependencias). */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = (cents) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(cents / 100);
  const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

  /* Giro de un libro 3D arrastrando (mouse o dedo). */
  function makeDraggable(handle, getBook, {onDragEnd} = {}) {
    let startX = 0, startY = 0, base = 0, dragging = false, moved = false, book = null;
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      book = getBook();
      if (!book) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      base = parseFloat(book.style.getPropertyValue('--tilt-y')) || 0;
    });
    handle.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved && Math.abs(event.clientY - startY) > Math.abs(dx)) {
        dragging = false;
        return;
      }
      if (!moved) {
        moved = true;
        handle.setPointerCapture(event.pointerId);
        book.classList.add('is-dragging');
        handle.classList.add('is-dragging');
      }
      book.style.setProperty('--tilt-y', `${base + dx * 0.6}deg`);
      book.style.setProperty('--tilt-x', '0deg');
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (!book) return;
      book.classList.remove('is-dragging');
      handle.classList.remove('is-dragging');
      if (moved) {
        handle.dataset.dragged = 'true';
        setTimeout(() => delete handle.dataset.dragged, 0);
        onDragEnd?.(book);
      }
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('click', (event) => {
      if (handle.dataset.dragged) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  /* 1. Hero: carrusel de libros 3D. */
  class IcaroHeroStage extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('[data-slide]')];
      this.stage = this.querySelector('[data-stage]');
      this.index = 0;
      if (!this.slides.length) return;
      if (this.slides.length > 1) this.buildControls();
      if (finePointer && !reduced) {
        this.stage.addEventListener('pointermove', (event) => this.tilt(event));
        this.stage.addEventListener('pointerleave', () => this.resetTilt());
      }
      makeDraggable(this.stage, () => this.activeBook(), {
        onDragEnd: (book) => setTimeout(() => {
          book.style.setProperty('--tilt-y', '0deg');
        }, 900),
      });
    }
    activeBook() {
      return this.slides[this.index]?.querySelector('.icaro-book');
    }
    tilt(event) {
      const book = this.activeBook();
      if (!book || book.classList.contains('is-dragging')) return;
      const rect = this.stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      book.style.setProperty('--tilt-y', `${x * 34}deg`);
      book.style.setProperty('--tilt-x', `${-y * 14}deg`);
      book.style.setProperty('--gloss', `${x * 120}%`);
    }
    resetTilt() {
      const book = this.activeBook();
      if (!book) return;
      book.style.setProperty('--tilt-y', '0deg');
      book.style.setProperty('--tilt-x', '0deg');
      book.style.setProperty('--gloss', '-60%');
    }
    buildControls() {
      const controls = this.querySelector('.icaro-hero__controls');
      const dots = this.querySelector('[data-dots]');
      this.dots = this.slides.map((slide, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ver libro ${i + 1} de ${this.slides.length}`);
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => this.go(i, true));
        dots.append(dot);
        return dot;
      });
      controls.hidden = false;
      this.querySelector('[data-prev]').addEventListener('click', () => this.go(this.index - 1, true));
      this.querySelector('[data-next]').addEventListener('click', () => this.go(this.index + 1, true));
      this.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') this.go(this.index + 1, true);
        if (event.key === 'ArrowLeft') this.go(this.index - 1, true);
      });
      if (reduced) return;
      this.paused = false;
      this.addEventListener('pointerenter', () => (this.paused = true));
      this.addEventListener('pointerleave', () => (this.paused = false));
      this.addEventListener('focusin', () => (this.paused = true));
      this.addEventListener('focusout', () => (this.paused = false));
      new IntersectionObserver(([entry]) => (this.visible = entry.isIntersecting)).observe(this);
      // Rotar solo tras la primera interacción: así el LCP queda en la primera portada.
      const start = () => {
        ['scroll', 'wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((type) => window.removeEventListener(type, start));
        setInterval(() => {
          if (!this.paused && this.visible && !document.hidden) this.go(this.index + 1);
        }, 6500);
      };
      ['scroll', 'wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((type) =>
        window.addEventListener(type, start, {once: true, passive: true})
      );
    }
    go(next, user = false) {
      const total = this.slides.length;
      next = (next + total) % total;
      if (next === this.index) return;
      if (user) this.paused = true;
      const current = this.slides[this.index];
      const incoming = this.slides[next];
      this.resetTilt();
      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      current.setAttribute('aria-hidden', 'true');
      current.inert = true;
      setTimeout(() => current.classList.remove('is-leaving'), 850);
      incoming.classList.remove('is-leaving');
      incoming.classList.add('is-active');
      incoming.removeAttribute('aria-hidden');
      incoming.inert = false;
      incoming.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
      this.dots[this.index].setAttribute('aria-current', 'false');
      this.dots[next].setAttribute('aria-current', 'true');
      this.index = next;
      // Precarga la portada siguiente.
      this.slides[(next + 1) % total].querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
    }
  }
  customElements.define('icaro-hero-stage', IcaroHeroStage);

  /* 3. Aparición escalonada de secciones bajo el pliegue. */
  if (!reduced && 'IntersectionObserver' in window && !window.Shopify?.designMode) {
    const sections = [...document.querySelectorAll('main > .shopify-section')].filter(
      (section) => section.getBoundingClientRect().top > window.innerHeight * 0.95
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        observer.unobserve(section);
        section.classList.add('is-in');
        setTimeout(() => {
          section.classList.remove('icaro-reveal', 'is-in');
          section.querySelectorAll('[data-icaro-stagger]').forEach((el) => {
            el.removeAttribute('data-icaro-stagger');
            el.style.removeProperty('--i');
          });
        }, 1400);
      });
    }, {rootMargin: '0px 0px -12% 0px'});
    sections.forEach((section) => {
      section.classList.add('icaro-reveal');
      section
        .querySelectorAll('.grid__item, .icaro-shelf__book, .icaro-flow__item, .icaro-quiz__option, .article-card-wrapper')
        .forEach((el, i) => {
          el.setAttribute('data-icaro-stagger', '');
          el.style.setProperty('--i', Math.min(i, 8));
        });
      observer.observe(section);
    });
  }

  /* 4. El libro vuela al carrito al agregarlo. */
  const flyScopes = '.card-wrapper, .product, .icaro-shelf__book, .icaro-flow__item, .icaro-quiz__item, .icaro-hero__slide, .icaro-sticky-buy';
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (reduced || !(form instanceof HTMLFormElement) || !/\/cart\/add/.test(form.action)) return;
    const scope = form.closest(flyScopes) || document.querySelector('.product');
    const source = scope?.querySelector('.icaro-book__front img, .product__media img, img');
    const target = document.getElementById('cart-icon-bubble');
    if (!source || !target || !source.getBoundingClientRect().width) return;
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const ghost = source.cloneNode();
    ghost.removeAttribute('loading');
    ghost.className = 'icaro-fly';
    Object.assign(ghost.style, {left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`});
    document.body.append(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost
      .animate(
        [
          {transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1},
          {transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 80}px) scale(.55) rotate(-12deg)`, opacity: 1, offset: 0.55},
          {transform: `translate(${dx}px, ${dy}px) scale(.08) rotate(-30deg)`, opacity: 0.2},
        ],
        {duration: 750, easing: 'cubic-bezier(.5,0,.3,1)'}
      )
      .finished.then(() => {
        ghost.remove();
        target.classList.remove('icaro-bump');
        void target.offsetWidth;
        target.classList.add('icaro-bump');
      });
  }, true);

  /* 5. Transición de portada entre listado y ficha (View Transitions). */
  if (!reduced) {
    const vtScopes = '.card-wrapper, .icaro-shelf__book, .icaro-flow__item, .icaro-quiz__item, .icaro-hero__slide';
    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href*="/products/"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank') return;
      const scope = link.closest(vtScopes);
      const img = scope?.querySelector('.icaro-book__front img, .card__media img, img');
      if (!img) return;
      document.querySelectorAll('[data-icaro-vt]').forEach((el) => {
        el.style.viewTransitionName = '';
        el.removeAttribute('data-icaro-vt');
      });
      document.documentElement.classList.add('icaro-vt-out');
      img.style.viewTransitionName = 'icaro-cover';
      img.setAttribute('data-icaro-vt', '');
    });
    window.addEventListener('pageshow', () => {
      document.documentElement.classList.remove('icaro-vt-out');
      document.querySelectorAll('[data-icaro-vt]').forEach((el) => {
        el.style.viewTransitionName = '';
        el.removeAttribute('data-icaro-vt');
      });
    });
  }

  /* 6. Coverflow 3D con pestañas por editorial. */
  class IcaroFlow extends HTMLElement {
    connectedCallback() {
      this.tabs = [...this.querySelectorAll('[role="tab"]')];
      this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
      this.tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => this.select(i));
        const preload = () => {
          const track = this.panels[i]?.querySelector('[data-track][data-src]');
          if (track) this.load(track);
        };
        tab.addEventListener('pointerenter', preload, {once: true});
        tab.addEventListener('focus', preload, {once: true});
        tab.addEventListener('keydown', (event) => {
          const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
          if (!step) return;
          const next = (i + step + this.tabs.length) % this.tabs.length;
          this.select(next);
          this.tabs[next].focus();
        });
      });
      this.panels.forEach((panel) => this.setupTrack(panel));
      this.select(0, false);
    }
    select(i, focusTrack = true) {
      this.tabs.forEach((tab, n) => {
        tab.setAttribute('aria-selected', n === i ? 'true' : 'false');
        tab.tabIndex = n === i ? 0 : -1;
      });
      this.panels.forEach((panel, n) => (panel.hidden = n !== i));
      const track = this.panels[i]?.querySelector('[data-track]');
      if (!track) return;
      if (track.dataset.src) {
        this.load(track).then(() => this.panels[i].hidden || this.select(i, focusTrack));
        return;
      }
      const items = track.querySelectorAll('.icaro-flow__item');
      const start = items[Math.min(2, items.length - 1)];
      if (start) track.scrollLeft = start.offsetLeft + start.offsetWidth / 2 - track.clientWidth / 2;
      this.update(track);
      if (focusTrack) track.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
    }
    /* Las pestañas 2+ llegan del servidor al abrirlas, para no inflar el HTML inicial. */
    load(track) {
      if (!track._loading) {
        track.classList.add('is-loading');
        track._loading = fetch(track.dataset.src)
          .then((response) => (response.ok ? response.text() : ''))
          .then((html) => {
            const source = new DOMParser().parseFromString(html, 'text/html').querySelector('.icaro-flow__track');
            track.replaceChildren(...(source ? source.children : []));
          })
          .catch(() => {})
          .finally(() => {
            delete track.dataset.src;
            track.classList.remove('is-loading');
          });
      }
      return track._loading;
    }
    setupTrack(panel) {
      const track = panel.querySelector('[data-track]');
      if (!track) return;
      let frame = 0;
      track.addEventListener('scroll', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => this.update(track));
      }, {passive: true});
      panel.querySelector('[data-flow-prev]')?.addEventListener('click', () => this.step(track, -1));
      panel.querySelector('[data-flow-next]')?.addEventListener('click', () => this.step(track, 1));
      track.addEventListener('click', (event) => {
        const item = event.target.closest('.icaro-flow__item');
        if (!item || event.target.closest('form')) return;
        if (Math.abs(parseFloat(item.style.getPropertyValue('--d')) || 0) > 0.5) {
          event.preventDefault();
          this.center(track, item);
        }
      });
      window.addEventListener('resize', () => this.update(track));
    }
    center(track, item) {
      track.scrollTo({left: item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth'});
    }
    step(track, dir) {
      const items = [...track.querySelectorAll('.icaro-flow__item')];
      const current = items.findIndex((item) => item.classList.contains('is-center'));
      const next = items[Math.max(0, Math.min(items.length - 1, current + dir))];
      if (next) this.center(track, next);
    }
    update(track) {
      const middle = track.scrollLeft + track.clientWidth / 2;
      track.querySelectorAll('.icaro-flow__item').forEach((item) => {
        const d = (item.offsetLeft + item.offsetWidth / 2 - middle) / item.offsetWidth;
        const clamped = Math.max(-1, Math.min(1, d));
        item.style.setProperty('--d', d.toFixed(3));
        item.style.setProperty('--r', clamped.toFixed(3));
        item.style.setProperty('--a', Math.min(Math.abs(d), 3).toFixed(3));
        item.classList.toggle('is-center', Math.abs(d) < 0.5);
      });
    }
  }
  customElements.define('icaro-flow', IcaroFlow);

  /* 7. Test de lectura: tema → presupuesto → estilo. */
  class IcaroQuiz extends HTMLElement {
    connectedCallback() {
      this.answers = {};
      this.steps = [...this.querySelectorAll('[data-step]')];
      this.progress = this.querySelector('[data-progress]');
      this.addEventListener('click', (event) => {
        const option = event.target.closest('[data-answer]');
        if (option) {
          event.preventDefault();
          this.answers[option.dataset.key] = option.dataset.answer;
          if (option.dataset.url) this.answers.url = option.dataset.url;
          if (option.dataset.label) this.answers.label = option.dataset.label;
          this.next(option.closest('[data-step]'));
        }
        if (event.target.closest('[data-restart]')) {
          this.answers = {};
          this.show(0);
        }
        if (event.target.closest('[data-back]')) {
          const current = this.steps.findIndex((step) => !step.hidden);
          this.show(Math.max(0, current - 1));
        }
      });
      this.classList.add('is-ready');
    }
    show(index) {
      this.steps.forEach((step, i) => {
        step.hidden = i !== index;
        step.classList.toggle('is-current', i === index);
      });
      if (this.progress) this.progress.style.setProperty('--p', `${(index / (this.steps.length - 1)) * 100}%`);
      const heading = this.steps[index].querySelector('h3, [data-focus]');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
    }
    next(step) {
      const index = this.steps.indexOf(step);
      if (index < this.steps.length - 2) return this.show(index + 1);
      this.show(this.steps.length - 1);
      this.results();
    }
    async results() {
      const box = this.querySelector('[data-results]');
      const title = this.querySelector('[data-results-title]');
      const more = this.querySelector('[data-results-more]');
      const {url, budget = 'all', mood = 'new', label = ''} = this.answers;
      title.textContent = label ? `Tu selección de ${label.toLowerCase()}` : 'Tu selección';
      more.href = url || '/collections/all';
      box.innerHTML = '<p class="icaro-quiz__loading">Buscando en la estantería…</p>';
      try {
        const response = await fetch(`${url}/products.json?limit=120`);
        if (!response.ok) throw new Error();
        const {products} = await response.json();
        const [min, max] = budget === 'all' ? [0, Infinity] : budget.split('-').map(Number);
        let picks = products.filter((product) => {
          const variant = product.variants.find((v) => v.available) || product.variants[0];
          const price = parseFloat(variant.price);
          return variant.available && price >= min && price <= (max || Infinity);
        });
        if (mood === 'new') picks.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        else if (mood === 'classic') picks.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
        else picks.sort(() => Math.random() - 0.5);
        picks = picks.slice(0, 4);
        if (!picks.length) {
          box.innerHTML = '<p class="icaro-quiz__loading">No encontramos libros disponibles con esa combinación. Prueba otro presupuesto o explora la colección completa.</p>';
          return;
        }
        box.innerHTML = picks.map((product) => this.card(product)).join('');
      } catch (error) {
        box.innerHTML = '<p class="icaro-quiz__loading">No pudimos cargar las recomendaciones. Explora la colección completa.</p>';
      }
    }
    card(product) {
      const variant = product.variants.find((v) => v.available) || product.variants[0];
      const image = product.images[0]?.src;
      const src = image ? `${image}${image.includes('?') ? '&' : '?'}width=300` : '';
      const cents = Math.round(parseFloat(variant.price) * 100);
      const url = `/products/${product.handle}`;
      const single = product.variants.length === 1;
      return `<article class="icaro-quiz__item">
        <a href="${url}" class="icaro-quiz__cover">${src ? `<img src="${src}" alt="${escapeHtml(product.title)}" loading="lazy" width="300" height="450">` : ''}</a>
        <p class="icaro-eyebrow">${escapeHtml(product.vendor || '')}</p>
        <h4><a href="${url}">${escapeHtml(product.title)}</a></h4>
        <p class="icaro-quiz__price">${money(cents)}</p>
        ${single ? `<form action="/cart/add" method="post" data-icaro-add>
          <input type="hidden" name="id" value="${variant.id}"><input type="hidden" name="quantity" value="1">
          <button class="icaro-pill" type="submit">Agregar al carrito</button>
          <p class="icaro-shelf__status" role="status" aria-live="polite"></p></form>`
          : `<a class="icaro-pill" href="${url}">Elegir edición</a>`}
      </article>`;
    }
  }
  customElements.define('icaro-quiz', IcaroQuiz);

  /* 8. Barra fija de compra en la ficha del libro. */
  class IcaroStickyBuy extends HTMLElement {
    connectedCallback() {
      this.mainButton = document.querySelector('.product__info-container product-form [name="add"]');
      this.button = this.querySelector('[data-sticky-add]');
      if (!this.mainButton || !this.button) return;
      this.button.addEventListener('click', () => this.mainButton.click());
      const sync = () => {
        this.button.disabled = this.mainButton.disabled;
        this.button.textContent = this.mainButton.disabled ? 'Agotado' : 'Agregar al carrito';
        const price = document.querySelector('.product__info-container .price');
        if (price) {
          const sale = price.classList.contains('price--on-sale');
          const el = price.querySelector(sale ? '.price__sale .price-item--last' : '.price__regular .price-item--regular');
          if (el) this.querySelector('[data-sticky-price]').textContent = el.textContent.trim();
        }
      };
      sync();
      new MutationObserver(sync).observe(this.mainButton, {attributes: true, attributeFilter: ['disabled']});
      const priceBox = document.querySelector('.product__info-container [id^="price-"]');
      if (priceBox) new MutationObserver(sync).observe(priceBox, {childList: true, subtree: true});
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        this.classList.toggle('is-visible', show);
        this.inert = !show;
        document.body.classList.toggle('icaro-sticky-on', show);
      }).observe(this.mainButton);
    }
  }
  customElements.define('icaro-sticky-buy', IcaroStickyBuy);

  /* 9. Visor 3D del libro en la ficha. */
  class IcaroBookViewer extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      this.book = this.querySelector('.icaro-book');
      if (!this.dialog || !this.book) return;
      this.angle = -24;
      this.querySelector('[data-viewer-open]').addEventListener('click', () => {
        this.dialog.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
        this.dialog.showModal();
        this.set(-24);
      });
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog || event.target.closest('[data-viewer-close]')) this.dialog.close();
        if (event.target.closest('[data-rotate]')) this.set(this.angle + Number(event.target.closest('[data-rotate]').dataset.rotate));
        if (event.target.closest('[data-flip]')) this.set(Math.abs(((this.angle % 360) + 360) % 360 - 180) < 90 ? -24 : 180);
      });
      this.dialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') this.set(this.angle + 45);
        if (event.key === 'ArrowLeft') this.set(this.angle - 45);
      });
      makeDraggable(this.querySelector('[data-viewer-stage]'), () => this.book, {
        onDragEnd: (book) => {
          this.angle += parseFloat(book.style.getPropertyValue('--tilt-y')) || 0;
          book.classList.add('is-dragging');
          book.style.setProperty('--tilt-y', '0deg');
          book.style.setProperty('--base-ry', `${this.angle}deg`);
          void book.offsetWidth;
          book.classList.remove('is-dragging');
        },
      });
    }
    set(angle) {
      this.angle = angle;
      this.book.style.setProperty('--tilt-y', '0deg');
      this.book.style.setProperty('--base-ry', `${angle}deg`);
    }
  }
  customElements.define('icaro-book-viewer', IcaroBookViewer);

  /* 10. Carrito: barra de envío gratis y recomendaciones. */
  let lastShipping = null;
  class IcaroShipBar extends HTMLElement {
    connectedCallback() {
      const p = this.style.getPropertyValue('--p');
      this.style.setProperty('--from', lastShipping ?? '0%');
      const wasComplete = parseFloat(lastShipping) >= 100;
      lastShipping = p;
      if (parseFloat(p) >= 100) {
        this.classList.add('is-complete');
        if (!wasComplete && !reduced) {
          this.classList.add('icaro-ship--celebrate');
          this.addEventListener('animationend', () => this.classList.remove('icaro-ship--celebrate'), { once: true });
        }
      }
    }
  }
  customElements.define('icaro-ship-bar', IcaroShipBar);

  const recCache = new Map();
  class IcaroCartRecs extends HTMLElement {
    async connectedCallback() {
      const url = this.dataset.url;
      if (!url) return;
      try {
        if (!recCache.has(url)) recCache.set(url, fetch(url).then((r) => (r.ok ? r.text() : '')));
        const html = await recCache.get(url);
        const list = new DOMParser().parseFromString(html, 'text/html').querySelector('.icaro-cart-recs__list');
        if (!list || !this.isConnected) return;
        const exclude = (this.dataset.exclude || '').split(',');
        list.querySelectorAll('[data-product-id]').forEach((item) => {
          if (exclude.includes(item.dataset.productId)) item.remove();
        });
        [...list.children].slice(3).forEach((item) => item.remove());
        if (!list.children.length) return;
        this.querySelector('[data-recs-list]').replaceChildren(...list.children);
        this.hidden = false;
      } catch (error) {
        /* Sin recomendaciones: el carrito sigue funcionando. */
      }
    }
  }
  customElements.define('icaro-cart-recs', IcaroCartRecs);
})();

/* Franja de logos: el HTML trae una copia; aquí se duplica para el desplazamiento continuo. */
document.querySelectorAll('[data-icaro-marquee]').forEach((viewport) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const track = viewport.querySelector('.icaro-logos__track');
  if (!track) return;
  const copy = track.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', '-1'));
  copy.querySelectorAll('img').forEach((img) => img.setAttribute('alt', ''));
  viewport.append(copy);
  viewport.classList.add('is-animated');
});

/* Nunca animar la salida hacia el carrito o el pago: el checkout de Shopify no admite View Transitions. */
window.addEventListener('pageswap', (event) => {
  const destination = event.activation?.entry?.url || '';
  if (event.viewTransition && /\/(checkouts?|cart)(\/|\?|$)/.test(new URL(destination, location.href).pathname + '/')) {
    event.viewTransition.skipTransition();
  }
});

/* Quiénes somos: el botón del mapa abre Waze en el celular y Google Maps en escritorio. */
document.addEventListener('click', (event) => {
  const link = event.target.closest('.icaro-about__map-link');
  if (!link || !window.matchMedia('(max-width: 749px)').matches) return;
  const waze = link.dataset.wazeUrl;
  if (!waze) return;
  event.preventDefault();
  window.location.href = waze;
});
