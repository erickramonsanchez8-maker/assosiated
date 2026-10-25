# SHALOM en Hostinger: instalación

Esta versión agrega el guardado de pedidos y solicitudes de reservación. No la consideres producción hasta configurar la base de datos y probarla en Hostinger.

## 1. Requisitos del plan
Confirma en hPanel que el plan contratado permite desplegar una aplicación Node.js. El producto Hostinger Web App/Node.js que se anuncia a $58.99 MXN/mes es una oferta de 48 meses; revisa el nombre exacto de tu producto y precio de renovación antes de pagar.

## 2. Crear la base de datos
En hPanel crea una base de datos MySQL. En phpMyAdmin selecciona esa base e importa `database.sql`. No compartas contraseñas ni las subas a GitHub.

## 3. Variables privadas
En la configuración de la aplicación Node.js define estas variables usando los datos de hPanel:
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER` = usuario MySQL completo
- `DB_PASSWORD` = contraseña MySQL
- `DB_NAME` = nombre completo de la base
- `ADMIN_KEY` = secreto aleatorio largo (mínimo 32 caracteres)
- `SHALOM_WHATSAPP` = teléfono oficial con lada, solo números (por ejemplo, 52...)
- `PORT` lo define normalmente Hostinger.

## 4. Despliegue
Conecta el repositorio a la aplicación Node.js y establece la carpeta de aplicación en `shalom-web` (si hPanel permite seleccionar la subcarpeta); de lo contrario, despliega el contenido de esta carpeta como raíz del proyecto. Comando de inicio: `npm start`.

## 5. Pruebas antes de publicar
- `/api/health` debe responder `{"ok":true}`.
- Enviar pedido de prueba y confirmar que aparece en la base.
- Enviar reservación de prueba y confirmar que aparece en la base.
- Revisar permisos de administración, cambios de estado y respaldo.
- Probar celular, escritorio y restauración de una copia.

## Estado de esta versión
- La página de tienda actual sigue conservando su flujo original de WhatsApp; aún debe conectarse al envío del nuevo formulario para guardar pedidos automáticamente.
- La ruta de reservaciones ya permite guardar solicitudes en la base, pero aún debe conectarse a un formulario visible en la web.
- Las rutas administrativas están protegidas por `ADMIN_KEY`; falta construir una pantalla administrativa cómoda antes de entregar el sistema al restaurante.
- La comprobación de reservaciones duplicadas/disponibilidad real y la carta/precios oficiales requieren reglas y datos aprobados por SHALOM.
