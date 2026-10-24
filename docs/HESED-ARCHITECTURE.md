# HESED — arquitectura y estado del sistema

## Estructura principal
- `HESED_LOCAL.html`: acceso local central y selector de empresas. Incluye el área administrativa de SHALOM y la integración local de Mi Parcela para LA HUERTA.
- `docs/hesed.html`: portal de entrada para GitHub Pages e instalación como aplicación web.
- `docs/befit.html`: módulo local de BEFIT para socios, asistencia, pagos, gastos, campañas y objetivos.
- `docs/shalom.html` y `docs/shalom-tienda.html`: sitio comercial y catálogo de SHALOM; no forman parte del sistema administrativo local.
- `shalom-web/`: copia de trabajo del sitio público que se puede separar a un repositorio independiente cuando corresponda.
- `docs/HESED-LOCAL-TEST-PLAN.md`: pruebas de aceptación manual.
- `docs/HESED-SUPABASE-SCHEMA.sql` y `docs/HESED-BACKEND-SETUP.md`: diseño preliminar para una futura base de datos central.
- `archive/`: fuentes originales de recuperación; no se usan como páginas activas.

## Empresas y alcance
- **SHALOM**: restaurante. Se conserva su panel administrativo y sus datos locales.
- **BEFIT**: gimnasio. El módulo actual es un prototipo local.
- **LA HUERTA**: operación agrícola con Mi Parcela. La visualización 3D no se incluye en la experiencia integrada de HESED.
- Los dos propietarios administran las tres empresas. Los datos de cada empresa deben mantenerse separados.
- La prioridad es validar el sistema administrativo local antes de conectar Supabase. La sincronización entre dispositivos todavía requiere autenticación central, políticas de acceso, migración y pruebas.

## Seguridad y preparación para producción
1. Configurar autenticación central segura y permitir exclusivamente a los dos propietarios.
2. Aplicar y revisar el esquema SQL y las políticas RLS en Supabase.
3. Integrar cada módulo con la base de datos y probar que los datos estén aislados por empresa.
4. Migrar los datos locales con respaldo y verificación en varios dispositivos.
5. Probar flujos y diseño en navegador de escritorio y móvil. Las comprobaciones previas de código no sustituyen las pruebas funcionales.
6. No guardar claves secretas, contraseñas ni información sensible en archivos públicos del repositorio.
7. Confirmar los datos oficiales y contenidos comerciales de SHALOM antes de activar pedidos o reservas reales.

## Limitaciones conocidas
- Los inicios de sesión locales son prototipos y no equivalen a autenticación segura de producción.
- Los datos guardados en un navegador no se sincronizan automáticamente con otros dispositivos.
- El esquema SQL es preliminar y no implica que Supabase ya esté conectado.
- La web de pedidos no procesa pagos ni garantiza el registro centralizado de pedidos.
