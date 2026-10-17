# Publicación de las cuatro webs

## Separación de marcas

- **ASSOSIATED — sitio corporativo:** `index.html`
- **ASSOSIATED — definición guiada de identidad:** `identidad.html`
- **Shalom — sitio del restaurante:** `Shalom — Sabor y Paz, Brunch & Dinner en Ciudad Guzmán (1).html`
- **Shalom — catálogo y solicitud de pedidos:** `shalom-tienda.html`

El panel administrativo interno sigue siendo `ASSOSIATED_163.html`; no es la página pública corporativa.

## Activar publicación con GitHub Pages

1. Abre el repositorio en GitHub: https://github.com/erickramonsanchez8-maker/assosiated
2. Entra en **Settings** → **Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**.
4. Selecciona la rama **main** y la carpeta **/(root)**. Guarda los cambios.
5. Espera a que GitHub marque la publicación como exitosa en esa misma pantalla.

Si la fuente de publicación ya está configurada, los cambios en la rama `main` se publicarán automáticamente. El archivo `.nojekyll` indica que el repositorio contiene páginas estáticas y no necesita que Jekyll procese el sitio.

## Antes de anunciar las páginas al público

- La página de Shalom conserva textos de menú que estaban marcados como ejemplos. El restaurante debe confirmar nombres, precios, fotografías, horarios, dirección y teléfono.
- La tienda permite seleccionar artículos y preparar una solicitud, pero no procesa pagos. Su número de WhatsApp está vacío hasta que Shalom confirme el número oficial.
- Para aceptar pagos en línea, almacenar pedidos en una base de datos o administrar entregas, hace falta integrar un proveedor de pagos y un backend seguro.
- La definición de identidad genera una base preliminar desde el navegador e permite imprimir/guardar PDF o descargar las respuestas JSON; no es todavía un panel multiusuario ni un servicio de almacenamiento central.
- `ASSOSIATED_163.html` continúa siendo una aplicación interna separada. Sus cuentas y datos siguen dependiendo del navegador; no la uses como autenticación central de los cuatro sitios.

No se han inventado datos comerciales ni se presentan solicitudes como compras o reservas confirmadas.
