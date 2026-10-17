# Publicación de las cuatro webs

## Separación de marcas

- **ASSOSIATED — sitio corporativo:** `docs/index.html`
- **ASSOSIATED — definición guiada de identidad:** `docs/identidad.html`
- **Shalom — sitio del restaurante:** `docs/shalom.html`
- **Shalom — catálogo y solicitud de pedidos:** `docs/shalom-tienda.html`

El panel administrativo interno sigue siendo `ASSOSIATED_163.html`; no es la página pública corporativa.

## Activar publicación con GitHub Pages

1. Abre el repositorio en GitHub: https://github.com/erickramonsanchez8-maker/assosiated
2. Entra en **Settings** → **Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**.
4. Selecciona la rama **main** y la carpeta **/docs**. Guarda los cambios.
5. Espera a que GitHub marque la publicación como exitosa en esa misma pantalla.

## URLs esperadas después de activar Pages

- ASSOSIATED: `https://erickramonsanchez8-maker.github.io/assosiated/`
- Definición de identidad ASSOSIATED: `https://erickramonsanchez8-maker.github.io/assosiated/identidad.html`
- Sitio de Shalom: `https://erickramonsanchez8-maker.github.io/assosiated/shalom.html`
- Tienda de Shalom: `https://erickramonsanchez8-maker.github.io/assosiated/shalom-tienda.html`

Estas direcciones son las esperadas una vez habilitada la publicación; la existencia de los archivos no confirma por sí sola que el sitio ya esté desplegado.

Si la fuente de publicación ya está configurada, los cambios en la rama `main` se publicarán automáticamente. El archivo `docs/.nojekyll` indica que el sitio contiene páginas estáticas y no necesita que Jekyll procese el sitio. Solo se publican los cuatro archivos de `docs`; el panel interno que está en la raíz queda fuera de esa publicación.

## Antes de anunciar las páginas al público

- La página de Shalom conserva textos de menú que estaban marcados como ejemplos. El restaurante debe confirmar nombres, precios, fotografías, horarios, dirección y teléfono.
- La tienda permite seleccionar artículos y preparar una solicitud, pero no procesa pagos. Su número de WhatsApp está vacío hasta que Shalom confirme el número oficial.
- Para aceptar pagos en línea, almacenar pedidos en una base de datos o administrar entregas, hace falta integrar un proveedor de pagos y un backend seguro.
- La definición de identidad genera una base preliminar en el navegador y permite imprimir/guardar un PDF o descargar las respuestas JSON; no es todavía un panel multiusuario ni un servicio de almacenamiento central.
- `ASSOSIATED_163.html` continúa siendo una aplicación interna separada. Sus cuentas y datos siguen dependiendo del navegador; no la uses como autenticación central de los cuatro sitios.

No se han inventado datos comerciales ni se presentan solicitudes como compras o reservas confirmadas.
