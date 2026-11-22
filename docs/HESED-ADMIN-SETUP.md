# HESED Administrativo · puesta en marcha

## Archivos
- `docs/hesed-administrativo.html`: aplicación web adaptable a móvil y escritorio.
- `docs/HESED-ADMIN-OPERATIONS.sql`: tablas de caja, permisos por negocio, comprobantes y auditoría inmutable.
- `docs/HESED-SUPABASE-SCHEMA.sql`: esquema base existente. Debe ejecutarse primero.

## Lo que ya incorpora la aplicación
- Acceso con Supabase Auth; no hay registro público ni contraseñas guardadas por HESED.
- Propietarios con rol `platform_admin` pueden cambiar entre SHALOM, BEFIT y LA HUERTA.
- Acceso por negocio mediante membresías: encargado, administración/contabilidad, recepcionista, operación y consulta.
- Apertura de caja individual por usuario y turno.
- Registro de ingresos y gastos por efectivo, tarjeta, transferencia u otro medio.
- Lectura asistida del total en fotografías de tickets mediante OCR; el importe siempre debe confirmarse manualmente.
- Adjuntar foto o PDF privado a un movimiento.
- Entrega de corte con cálculo de efectivo esperado y diferencia validado también en PostgreSQL.
- Revisión, solicitud de aclaración y conciliación por administración.
- Historial por negocio, filtros y exportación CSV.
- Reportes mensuales por negocio.\n- Importación de Excel/CSV con selección de hoja y columna, comparación de totales contra HESED y registro histórico de cada conciliación.
- Actualización en tiempo real entre dispositivos conectados.
- Diseño responsive y navegación inferior en celular.

## Configuración obligatoria antes de usar dinero real
1. Crear un proyecto Supabase dedicado a HESED.
2. Abrir SQL Editor y ejecutar primero `HESED-SUPABASE-SCHEMA.sql`.
3. Ejecutar después `HESED-ADMIN-OPERATIONS.sql`.
4. En Supabase Auth, desactivar el registro público. Invitar a los propietarios y a cada empleado desde Authentication → Users → Invite user.
5. Tras crear las cuentas de propietarios, asignarles `platform_admin` en `public.profiles`. No compartir ni guardar contraseñas en el repositorio.
6. En `public.memberships`, asignar a cada usuario solo los negocios a los que debe entrar. Roles: `manager`, `accountant`, `receptionist`, `operator`, `viewer`. Los dos propietarios usan `profiles.platform_role='platform_admin'`.
7. Publicar GitHub Pages desde la carpeta `docs` (branch `main), o usar el despliegue existente del portal.
8. Abrir `hesed-administrativo.html`, elegir Configuración técnica e introducir Project URL y la clave pública anon/publishable. Nunca introducir `service_role`.
9. Probar con cuentas distintas: propietarios, encargado y recepcionista. Confirmar que la recepcionista solo ve sus propias cajas y movimientos; los encargados ven las cajas del negocio; ningún usuario de una división puede consultar otra.
10. Probar foto/PDF, OCR, cortes, diferencias, conciliación, exportación y sincronización en dos teléfonos antes de capturar operaciones reales.

## Alta de usuarios y asignación
La cuenta se invita desde Supabase Auth; el panel no permite auto-registro. Después, en HESED → Personal, pega el UUID del usuario y asigna su rol en el negocio actual. Un usuario puede recibir membresía en más de un negocio. Los propietarios administran los tres mediante `platform_admin`.

## Modelo de caja
Cada recepcionista abre su propia sesión. El efectivo esperado se calcula con fondo inicial + ingresos en efectivo − gastos en efectivo. Tarjeta y transferencias no forman parte del efectivo físico. Al entregar el corte, el servidor vuelve a calcular y valida el importe; el corte pasa a administración. Los movimientos no se editan ni eliminan: cualquier corrección debe capturarse como movimiento adicional de ajuste, con su concepto y nota.

## Conservación y auditoría
Los movimientos son inmutables y cada alta o cambio de estado de un corte genera una entrada en `audit_logs`. No hay botón para borrar. Los comprobantes se guardan en el bucket privado `hesed-evidence`. La base central no sustituye los respaldos: habilitar respaldos automáticos de Supabase según el plan contratado, exportar respaldos externos cifrados y probar restauraciones de forma periódica. Definir la retención de comprobantes conforme a la política contable y legal de la alianza.

## Limitaciones que deben quedar claras
- El código y el esquema están preparados en el repositorio, pero no se puede activar una instancia Supabase ni invitar usuarios desde GitHub. Eso requiere acceso del propietario al proyecto Supabase.
- No se debe considerar producción hasta ejecutar el SQL, configurar cuentas y probar RLS, almacenamiento, sincronización y restauración con usuarios reales.
- El OCR es una ayuda de captura, no un sistema de lectura contable infalible. El empleado debe verificar el importe del ticket.
- El reporte mensual resume los movimientos registrados en HESED. La importación y conciliación automatizada de archivos Excel históricos de BEFIT requiere mapear el formato real de cada archivo antes de activar esa migración.
