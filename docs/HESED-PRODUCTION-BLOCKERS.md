# HESED — pendientes para liberar el sistema administrativo

## Alcance confirmado
- Los únicos usuarios son los dos propietarios; ambos administran SHALOM, BEFIT y LA HUERTA.
- El objetivo es que puedan instalar HESED en sus dispositivos y compartir la misma información con sincronización en tiempo real.
- El sitio público de SHALOM, su tienda electrónica y las reservas de clientes quedan fuera del trabajo prioritario actual.

## Bloqueadores reales para producción

### 1. Proyecto backend
Crear un proyecto Supabase dedicado a HESED, aplicar el esquema SQL actualizado y verificar que las funciones, políticas RLS y publicación Realtime se hayan creado correctamente.

### 2. Acceso exclusivo para propietarios
Desactivar el registro público en Supabase Auth e invitar solo las dos cuentas de propietarios. Después de crear ambas cuentas, asignarles el rol administrativo desde el SQL Editor. No se deben compartir contraseñas ni claves privadas en el chat.

### 3. Conectar los módulos existentes
El portal HESED tiene ahora un manifiesto PWA, un icono y un service worker básico. Esto prepara la instalación desde navegadores compatibles, pero no sincroniza los datos todavía.
- Conectar SHALOM administrativo, BEFIT y LA HUERTA / Mi Parcela con Supabase Auth, PostgreSQL y Realtime.
- Sustituir el guardado local de BEFIT por operaciones en la base central.
- Proteger cada módulo, no solo la pantalla de inicio, con sesión y autorización en servidor.
- No borrar ni sobrescribir los datos locales existentes durante la migración.

### 4. Validación
- Confirmar que solo las dos cuentas invitadas pueden entrar.
- Verificar que los dos propietarios accedan a los tres negocios.
- Probar desde dos o más dispositivos que los cambios confirmados aparezcan en los demás en segundos.
- Probar pérdida de conexión y recuperación, respaldo/exportación, y aislamiento entre negocios.
- Realizar pruebas visuales y funcionales en escritorio, tablet y móvil.

## Fuera del alcance por ahora
La separación del sitio público de SHALOM en un repositorio independiente, el menú comercial, las reservas públicas y el e-commerce no bloquean el desarrollo del sistema administrativo y no deben distraer de la prioridad actual.

## No declarar listo para producción todavía
El backend aún no está desplegado y los módulos administrativos no están conectados a una base de datos compartida. No se han ejecutado pruebas reales de navegador ni pruebas de seguridad contra un proyecto Supabase activo.
