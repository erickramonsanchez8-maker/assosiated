# Publicación de las webs

## Las webs y la separación de marcas

- **ASSOSIATED — sitio corporativo + Brand Studio integrado:** `docs/hearth.html` (con `docs/index.html` como entrada que redirige a `hearth.html`)
- **Alias de compatibilidad para el antiguo enlace de identidad:** `docs/identidad.html` (redirige a `hearth.html#studio`)
- **Shalom — sitio del restaurante:** `docs/shalom.html`
- **Shalom — catálogo y solicitud de pedidos:** `docs/shalom-tienda.html`

La definición de identidad es parte de la página principal de ASSOSIATED; no es una marca ni un servicio web separado. La página de Shalom y su tienda son exclusivamente de Shalom.

El panel interno `ASSOSIATED_163.html` no está dentro de `docs` y no debe enlazarse desde la navegación pública.

## Qué contiene Brand Studio

- Brief de marca editable con nombre, tagline, sector, audiencia, propuesta, diferenciador y personalidad.
- Paletas iniciales y edición manual de cuatro colores.
- Carga local de logo PNG/JPG/WebP con vista previa en seis aplicaciones: tarjeta, post social, empaque/vaso, página web, fachada y papelería.
- Tres orientaciones tipográficas, comprobación orientativa de contraste y síntesis de posicionamiento preliminar.
- Guardado de borrador en el almacenamiento local del navegador, exportación de proyecto JSON y vista de impresión para guardar como PDF.

El logo y las respuestas se procesan en el navegador; no se envían a un servidor. Los mockups son previsualizaciones de dirección creativa, no fotografías de producción. El posicionamiento generado es una hipótesis y debe validarse con el cliente y su público. El almacenamiento local no equivale a una base de datos multiusuario ni sincroniza entre dispositivos.

## Activar GitHub Pages

1. Abre el repositorio: https://github.com/erickramonsanchez8-maker/assosiated
2. Entra en **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Selecciona la rama **main** y la carpeta **/docs**.
5. Guarda y confirma que GitHub muestre un despliegue exitoso.

El archivo `docs/.nojekyll` indica que el sitio estático no necesita procesamiento de Jekyll. Solo se publica la carpeta `docs`.

## URL esperadas cuando Pages esté activo

- ASSOSIATED + Brand Studio: `https://erickramonsanchez8-maker.github.io/assosiated/`
- Acceso directo al estudio: `https://erickramonsanchez8-maker.github.io/assosiated/hearth.html#studio`
- Shalom: `https://erickramonsanchez8-maker.github.io/assosiated/shalom.html`
- Tienda de Shalom: `https://erickramonsanchez8-maker.github.io/assosiated/shalom-tienda.html`

Estas direcciones son las previstas; la existencia de los archivos no demuestra por sí sola que Pages ya esté desplegado.

## Pendientes antes de lanzamiento comercial

- Shalom debe validar nombres y descripciones del menú, precios, horarios, dirección, teléfono, fotos reales y número oficial de WhatsApp. La página existente identifica parte del menú como contenido de ejemplo.
- La tienda permite preparar una solicitud, pero aún no procesa cobros ni registra pedidos en una base de datos central. Para vender y gestionar pedidos de forma segura hace falta integrar un backend y un proveedor de pagos.
- El repositorio de GitHub es público. Configurar Pages para servir solo `/docs` no hace privados los archivos de la raíz. No se deben guardar claves, contraseñas ni datos sensibles en el repositorio.
- El panel `ASSOSIATED_163.html` mantiene datos y autenticación ligados al navegador; no es la autenticación central de estas webs y no debe manejar información sensible hasta migrar a un backend seguro.
