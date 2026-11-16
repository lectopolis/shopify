# Lectópolis — tienda Shopify

Rediseño sobre el tema exportado el 16 de noviembre de 2026. La referencia visual es la captura del Instagram `@librerialectopolis` facilitada por el propietario. La trayectoria de más de 15 años procede de su indicación.

## Análisis en cinco aspectos

1. **Color:** violeta y amarillo para novedades; verde y azul eléctrico para contenidos participativos; coral y menta para autores y divulgación. Los tonos web son aproximaciones visuales de la captura, no un manual de marca oficial.
2. **Composición:** titulares grandes, contrastes intensos, collage, formas gráficas y portadas protagonistas. Se trasladan a una portada editorial, tarjetas de color y libros con perspectiva.
3. **Contenido:** se ven novedades, Coraline, Bridgerton, Isabel Allende, curiosidades y selecciones temáticas. Son referencias al estilo de publicación; no se afirma que estén disponibles para comprar.
4. **Conversación:** preguntas, descubrimiento y divulgación literaria. La navegación invita a descubrir lecturas, buscar libros y acercarse a la librería por Instagram.
5. **Confianza y venta:** la trayectoria se destaca junto al catálogo, con títulos, precios, imágenes y disponibilidad obtenidos de Shopify. No se inventan reseñas, descuentos, envíos gratis ni números de contacto.

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
