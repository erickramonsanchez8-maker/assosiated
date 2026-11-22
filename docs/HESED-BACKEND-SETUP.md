# HESED · puesta en marcha del backend

## Alcance
HESED es un sistema administrativo privado para SHALOM, BEFIT y LA HUERTA. Los dos propietarios tienen acceso global mediante `platform_admin`; los empleados entran mediante invitación y permisos por negocio. No hay registro público.

## Esquema backend
1. Ejecutar `HESED-SUPABASE-SCHEMA.sql`.
2. Ejecutar `HESED-ADMIN-OPERATIONS.sql`.

El esquema operativo agrega:
- Membresías y roles de negocio para encargados, contabilidad, recepcionistas, operación y consulta.
- Sesiones de caja individuales por usuario y turno.
- Movimientos inmutables, cortes, diferencias y conciliación.
- Comprobantes privados en Storage.
- Auditoría de movimientos, cortes, evidencias y asignaciones.
- Comparaciones históricas de Excel/CSV.
- Políticas RLS y publicación Realtime.

## Configuración
1. Crear un proyecto Supabase dedicado a HESED.
2. Ejecutar los dos archivos SQL en el orden indicado.
3. Desactivar el registro público en Supabase Auth.
4. Invitar a los dos propietarios y a cada empleado desde Authentication → Users → Invite user.
5. Asignar `platform_role = 'platform_admin'` a las cuentas de los propietarios después de crearlas.
6. Asignar membresías por negocio. No otorgar permisos globales a recepcionistas.
7. Configurar la URL y la clave pública anon/publishable en el panel HESED. Nunca colocar `service_role` en el navegador.
8. Habilitar y revisar respaldos automáticos y copias externas cifradas.

## Seguridad y sincronización
- RLS aplica permisos en PostgreSQL; ocultar botones no sustituye controles del servidor.
- Las recepcionistas solo ven sus propias sesiones y movimientos.
- Encargados y contabilidad pueden consultar y conciliar las cajas de su negocio.
- Los propietarios pueden consultar las tres divisiones.
- Los movimientos y registros de auditoría no se pueden borrar desde la aplicación.
- Realtime actualiza los dispositivos conectados; al reconectar, el cliente vuelve a consultar los registros.
- No guardar datos financieros sensibles en caché offline.

## Pruebas de aceptación
- Probar dos propietarios y al menos una cuenta de recepcionista por negocio.
- Confirmar aislamiento entre SHALOM, BEFIT y LA HUERTA.
- Probar apertura, movimientos, cierre, diferencia, aclaración y conciliación.
- Verificar que el importe esperado sea recalculado por PostgreSQL.
- Probar carga y descarga de comprobantes.
- Probar OCR y confirmar manualmente los importes.
- Comparar archivos Excel reales y validar las columnas elegidas.
- Probar sincronización en dos dispositivos y restaurar una copia de seguridad.

No declarar producción hasta completar estas pruebas con usuarios y datos de prueba.
