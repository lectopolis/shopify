// Load the reviews badge after the storefront has finished its initial load.
(() => {
  const loadWidget = () => {
    if (document.getElementById('merchantWidgetScript')) return;
    const script = document.createElement('script');
    script.id = 'merchantWidgetScript';
    script.src = 'https://www.gstatic.com/shopping/merchant/merchantwidget.js';
    script.async = true;
    script.addEventListener('load', () => {
      if (window.merchantwidget) {
        // LEFT_BOTTOM: evita que choque con el botón flotante de WhatsApp (abajo a la derecha)
        // cuando Google decida mostrar el sello (requiere reseñas suficientes en Merchant Center).
        window.merchantwidget.start({ merchant_id: 666312843, position: 'LEFT_BOTTOM', region: 'CO' });
      }
    }, { once: true });
    document.head.appendChild(script);
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadWidget, { timeout: 3000 });
    else window.setTimeout(loadWidget, 1000);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
