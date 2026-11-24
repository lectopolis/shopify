# Lectópolis — tienda Shopify

Rediseño sobre el tema exportado el 16 de noviembre de 2026. La referencia visual es la captura del Instagram `@librerialectopolis` facilitada por el propietario. La trayectoria de más de 15 años procede de su indicación.

## Análisis en cinco aspectos

1. **Color:** paleta tomada del logo: blanco de fondo, negro para texto, botones y franjas, y azul (cian del logo #22b2db para acentos y fondos; azul profundo #0b6e99 para enlaces y enfoque, con contraste legible sobre blanco).
2. **Composición:** titulares grandes, contrastes intensos, collage, formas gráficas y portadas protagonistas. Se trasladan a una portada editorial, tarjetas de color y libros con perspectiva.
3. **Contenido:** se ven novedades, Coraline, Bridgerton, Isabel Allende, curiosidades y selecciones temáticas. Son referencias al estilo de publicación; no se afirma que estén disponibles para comprar.
4. **Conversación:** preguntas, descubrimiento y divulgación literaria. La navegación invita a descubrir lecturas, buscar libros y acercarse a la librería por Instagram.
5. **Confianza y venta:** la trayectoria se destaca junto al catálogo, con títulos, precios, imágenes y disponibilidad obtenidos de Shopify. No se inventan reseñas, descuentos ni envíos gratis. El teléfono +57 313 6118658 y la oferta de libros nuevos y leídos con envíos nacionales fueron confirmados por el propietario.

## Diseño y edición

- `sections/lectopolis-home.liquid`: inicio, selección de libros, categorías, trayectoria y búsqueda.
- `assets/lectopolis.css`: paleta, estilos y adaptación móvil.
- `assets/lectopolis.js`: movimiento 3D ligado al scroll con `requestAnimationFrame`, pausa fuera de pantalla y respeto de `prefers-reduced-motion`.
- `sections/lectopolis-header.liquid` y `sections/lectopolis-footer.liquid`: identidad y navegación compartidas.
- En el editor de Shopify, seleccionar **Lectópolis · Inicio → Selección de libros** para elegir una colección. Sin selección se usa el catálogo general.
- Cada bloque de categoría permite elegir una colección; sin colección realiza una búsqueda por su título.
- Con catálogo vacío se muestra un mensaje y el enlace a Instagram. Las cubiertas tipográficas del hero son decorativas y se reemplazan por imágenes reales cuando existen productos.

## Migración del tema

Se retiraron 385 archivos del tema anterior que no pertenecían al ZIP del tema correcto. Permanecen recuperables en el historial Git. Se retiraron de las rutas principales la identidad, el WhatsApp, los metadatos, los bloques de reseñas de aplicaciones y las promociones de envío de la tienda anterior. Se mantienen los flujos nativos de producto, variantes, carrito y checkout de Shopify.

Se corrigieron tres incompatibilidades heredadas de Liquid/esquema/imágenes, se sincronizaron seis variantes regionales de traducción con sus versiones de idioma y se retiraron claves de traducción obsoletas de GemPages que no utiliza el código del tema.

## Verificación

- Shopify Theme Check: cero errores; permanecen avisos de código heredado.
- Validación de JavaScript y de identificadores únicos en los esquemas nuevos.
- Render local Liquid con catálogo de prueba y catálogo vacío.
- Navegador sin interfaz: anchos 320, 375, 768 y 1440 px, sin desbordamiento horizontal; movimiento 3D, preferencia de movimiento reducido, apertura/cierre del carrito y envío de búsqueda.
- Las capturas de desarrollo usan productos ficticios exclusivamente en el entorno temporal de pruebas. No se incluyen esos productos ni sus precios en el tema.

El render local no sustituye la verificación en la tienda: comprobar la sincronización de GitHub, las imágenes y colecciones reales, una variante disponible, agregar al carrito y el acceso al checkout antes de publicar. No se ha realizado ninguna compra ni se ha cambiado el tema publicado desde el administrador de Shopify.

## Identidad de la librería

Se retiraron las plantillas y recursos de marca heredados que no se utilizan. Los componentes funcionales conservados ahora usan el prefijo `lectopolis`. Las páginas, los metadatos y la información para buscadores presentan a Lectópolis como librería de libros nuevos y leídos, con más de 15 años de trayectoria y envíos nacionales. El contacto confirmado es +57 313 6118658. No se publican direcciones, horarios, reseñas ni servicios comerciales de la empresa anterior.

## Catálogo y fichas de libros

El catálogo y la búsqueda muestran cuatro columnas en escritorio y dos en móvil. Las fichas usan la paleta de Lectópolis, títulos legibles, disponibilidad de la variante seleccionada y consulta por WhatsApp con la edición. Autor, código y políticas solo aparecen cuando existen datos. No se asigna automáticamente el estado nuevo/leído a los productos. Verificado con render local en 320, 375, 768 y 1440 px y con estados disponible/agotado; la actualización de variantes y el checkout requieren verificación en Shopify.

## Rendimiento

- Banner principal: el PNG de 2,2 MB se reemplazó por WebP en cuatro tamaños (750, 1100, 1600 y 2172 px; de 34 KB a 170 KB) con `srcset`, de modo que cada pantalla descarga solo el tamaño que necesita.
- Logo: el JPG cuadrado de 1386 px (60 KB) recortado por CSS se reemplazó por el área visible recortada en WebP (260 y 520 px; 5–10 KB).
- Se retiraron del tema los PNG de banner sin uso (historias y logo v2) y el JPG original del logo; siguen en el historial Git.
- Los estilos del carrito lateral y de la búsqueda predictiva se cargan sin bloquear el primer pintado. Una regla en línea mantiene oculto el carrito mientras tanto.
- Las tarjetas de producto ya no cargan los estilos de pedido rápido por volumen ni de valoraciones cuando no se usan.
