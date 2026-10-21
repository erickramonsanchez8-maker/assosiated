# HESED — arquitectura y estado de integración

## Mapa de proyectos
- **ASSOCIATED**: portal de acceso y futura capa común de autenticación, permisos y navegación.
- **SHALOM**: restaurante. Sitio comercial y tienda en `shalom-web/`, separados del panel operativo.
- **BEFIT**: módulo inicial en `docs/befit.html` para registrar socios, gastos, campañas y objetivos; permite exportar CSV y respaldo JSON. Actualmente usa almacenamiento local.
- **LA HUERTA / AGROVA — Mi Parcela**: acceso en `docs/hesed-huerta.html` a una copia del HTML existente. Sus funciones originales no se han sustituido.

## Integrado en `main`
- Portal central `docs/hesed.html` con el logotipo HESED.
- Copia del panel ASSOCIATED 163 en `docs/hesed-gestion.html`.
- Copia de Mi Parcela en `docs/hesed-huerta.html`.
- Módulo inicial BEFIT en `docs/befit.html`, con logotipo y registros locales.
- Paquete web de SHALOM en `shalom-web/index.html` y `shalom-web/shalom-tienda.html`.
- Esquema preliminar de backend en `docs/HESED-SUPABASE-SCHEMA.sql` y guía en `docs/HESED-BACKEND-SETUP.md`.

## Alcance confirmado
- Solo entran los dos propietarios, y ambos administran SHALOM, BEFIT y LA HUERTA.
- No habrá registro público, usuarios de empleados ni cuentas de clientes dentro de HESED.
- El trabajo prioritario es el sistema administrativo sincronizado entre dispositivos. La web pública, la tienda y las reservas públicas de SHALOM quedan fuera del alcance por ahora.
- El portal tiene manifiesto PWA y un service worker inicial para instalar la carcasa desde navegadores compatibles; esto no equivale a sincronización de datos ni a modo offline completo.

## Requisitos para producción
1. Crear un proyecto Supabase, aplicar y revisar el esquema SQL, desactivar el registro público e invitar exclusivamente a los dos propietarios; asignarles `platform_admin` de forma segura.
2. Integrar cada módulo administrativo con Auth, base de datos y Realtime; migrar los datos locales con respaldo y pruebas en varios dispositivos.
3. Probar las políticas de RLS con usuarios de cada negocio y verificar que no puedan leer datos de otros negocios.
4. Completar y verificar el modelo de La Huerta contra los campos y flujos reales de Mi Parcela antes de migrar información agrícola.
5. Confirmar carta, precios, horarios, dirección, WhatsApp, Instagram y teléfonos oficiales de SHALOM antes de habilitar pedidos o reservas reales.
6. Trasladar `shalom-web/` a un repositorio dedicado `shalom-web`. El conector GitHub disponible en esta sesión no permite crear repositorios nuevos; requiere que el propietario cree el repositorio vacío.
7. Ejecutar pruebas funcionales y visuales en escritorio y móvil; esta sesión ha verificado archivos y cambios del repositorio por lectura de código, no mediante pruebas de navegador.

## Seguridad y límites
- El módulo BEFIT actual es un prototipo local, no multiusuario.
- El esquema SQL es una base inicial que debe revisarse y aplicarse en el proyecto Supabase del propietario; no está desplegado desde este repositorio.
- Nunca exponer una clave `service_role` en HTML/JavaScript público.
- El sitio comercial de SHALOM conserva campos de contacto vacíos y elementos de carta de ejemplo; no presentarlos como datos confirmados.
