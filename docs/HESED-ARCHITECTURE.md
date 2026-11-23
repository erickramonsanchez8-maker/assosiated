# HESED — arquitectura y estado de integración

## Mapa de proyectos
- **HESED ASSOCIATED**: portal central y administración compartida.
- **SHALOM**: restaurante y operación propia.
- **BEFIT**: gimnasio y operación propia.
- **LA HUERTA / AGROVA**: operación agrícola y Mi Parcela.

## Centro administrativo
La aplicación principal de administración está en `docs/hesed-administrativo.html`. Incluye autenticación Supabase, roles por negocio, cajas individuales por usuario y turno, movimientos, cortes, conciliación, reportes, importación de Excel/CSV, evidencias de tickets, OCR asistido, historial y sincronización Realtime.

## Modelo de acceso
- Los dos propietarios usan `profiles.platform_role = 'platform_admin'` y pueden cambiar entre SHALOM, BEFIT y LA HUERTA.
- Cada empleado recibe una cuenta invitada desde Supabase Auth y una membresía por negocio.
- Roles de negocio: `manager`, `accountant`, `receptionist`, `operator`, `viewer`.
- Las recepcionistas solo consultan sus propias cajas y movimientos; administración puede revisar las cajas del negocio.
- No existe registro público.

## Persistencia y auditoría
- PostgreSQL/Supabase es la fuente central de verdad.
- Los movimientos de caja no se editan ni eliminan; las correcciones se registran como ajustes.
- Cortes, comprobantes y asignaciones de personal generan auditoría.
- Los comprobantes se guardan en un bucket privado.
- Realtime sincroniza sesiones y movimientos entre dispositivos.
- Los respaldos y restauraciones deben configurarse y probarse desde Supabase; la base activa no sustituye una copia externa.

## Archivos principales
- `docs/hesed.html`: portal de entrada.
- `docs/hesed-administrativo.html`: aplicación administrativa responsive.
- `docs/HESED-SUPABASE-SCHEMA.sql`: esquema base.
- `docs/HESED-ADMIN-OPERATIONS.sql`: roles, cajas, categorías, auditoría, evidencias, conciliaciones Excel e historial de diagnósticos analíticos.
- `docs/HESED-ADMIN-SETUP.md`: pasos de instalación y pruebas.
- `docs/hesed-gestion.html`: panel previo de análisis y campañas.
- `docs/befit.html`: módulo previo de BEFIT.
- `docs/hesed-huerta.html`: acceso a Mi Parcela.

## Estado de liberación
El código está incorporado en `main`, pero el sistema no se considera productivo hasta conectar un proyecto Supabase real, ejecutar ambos SQL, invitar y asignar usuarios, validar las políticas RLS, probar desde varios teléfonos y verificar respaldos y restauración.
