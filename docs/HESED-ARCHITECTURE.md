# HESED — arquitectura de integración

## Mapa de proyectos
- **ASSOCIATED**: acceso y futura capa común de autenticación, permisos y navegación.
- **SHALOM**: restaurante; la web comercial y la tienda son un proyecto separado del panel operativo.
- **BEFIT**: administración de gimnasios; requiere un módulo propio.
- **LA HUERTA / AGROVA — Mi Parcela**: conservar las funciones agrícolas actuales y conectarlas como módulo independiente.

## Estado de la integración
El portal `hesed.html` enlaza copias independientes de los archivos originales. Esta entrega no modifica los archivos originales del proyecto y no debe interpretarse como autenticación central implementada.

## Requisitos antes de producción
1. Backend de autenticación con contraseñas almacenadas con hash seguro y sesiones protegidas.
2. Roles y permisos por negocio (administración general, Shalom, Befit y La Huerta).
3. API y base de datos compartida con separación de datos por negocio y registro de auditoría.
4. Migración explícita de datos desde almacenamiento local, con copia de seguridad y pruebas de regresión.
5. Implementación real de BEFIT, con métricas de gimnasios y datos separados.
6. Pruebas funcionales y visuales en escritorio y móvil, más pruebas de seguridad.

## Límites conocidos
Las aplicaciones existentes dependen de almacenamiento local y/o recursos del navegador. Eso no equivale a persistencia central ni a controles de acceso de servidor. No introducir datos de ejemplo como si fueran métricas reales.
