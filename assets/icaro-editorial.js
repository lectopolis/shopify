document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-icaro-add]');
  if (!form || typeof fetch !== 'function') return;
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  const status = form.querySelector('[role="status"]');
  const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
  const body = new FormData(form);
  if (cart) {
    body.append('sections', cart.getSectionsToRender().map((section) => section.id).join(','));
    body.append('sections_url', window.location.pathname);
    cart.setActiveElement(button);
  }
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  status.textContent = 'Agregando…';
  try {
    const response = await fetch(form.action + '.js', {method: 'POST', body, headers: {'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json'}});
    const result = await response.json();
    if (!response.ok || result.status) throw new Error(result.description || 'No pudimos agregar este libro. Consulta su disponibilidad en la ficha.');
    status.textContent = 'Libro agregado al carrito.';
    if (typeof publish === 'function') publish(PUB_SUB_EVENTS.cartUpdate, {source: 'icaro-shelf', productVariantId: body.get('id'), cartData: result});
    if (cart) {cart.classList.remove('is-empty'); cart.renderContents(result);}
    else window.location.assign(window.routes.cart_url);
  } catch (error) {
    status.textContent = error.message === 'Failed to fetch' ? 'No hay conexión. Intenta de nuevo o abre la ficha del libro.' : error.message;
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});
