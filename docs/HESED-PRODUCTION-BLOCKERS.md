# HESED — pendientes para liberar el sistema administrativo

## Estado
El nuevo centro administrativo responsive está integrado en `docs/hesed-administrativo.html`. El código está en `main`; el backend Supabase todavía requiere configuración en la cuenta del propietario.

## Bloqueadores antes de operar con dinero real
1. Activar GitHub Pages en Settings → Pages y seleccionar GitHub Actions. Después ejecutar el workflow “Publicar HESED en GitHub Pages” desde Actions. El workflow ya está integrado; la primera activación debe hacerla un propietario del repositorio.
2. Crear el proyecto Supabase dedicado a HESED. Ejecutar `HESED-SUPABASE-SCHEMA.sql` y después `HESED-ADMIN-OPERATIONS.sql`.
3. Desactivar registro público, invitar a los dos propietarios y asignar `platform_admin`.
4. Invitar recepcionistas y encargados y asignar membresías con el mínimo permiso necesario.
5. Configurar URL y clave pública Supabase en el panel; nunca publicar `service_role`.
6. Probar RLS con usuarios de SHALOM, BEFIT y LA HUERTA.
7. Probar cortes individuales, conciliación, comprobantes, OCR, importación Excel y reportes.
8. Configurar respaldos externos y comprobar restauración.
9. Validar uso real en Safari iOS, Chrome Android y escritorio.

## Criterios de aceptación
- Cada recepcionista solo puede consultar su caja y sus movimientos.
- Administración ve todas las cajas de su negocio.
- Los dos propietarios pueden cambiar entre los tres negocios.
- El efectivo esperado se valida en el servidor.
- No se pueden editar ni eliminar movimientos ni auditorías.
- Evidencias se almacenan en bucket privado.
- Comparaciones Excel quedan registradas.
- Cambios confirmados aparecen en otros dispositivos conectados.
- Los datos sobreviven al cierre de sesión y cambio de dispositivo.

No considerar HESED listo para producción hasta cerrar todos los puntos anteriores.
