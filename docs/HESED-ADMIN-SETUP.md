# HESED Administrativo · puesta en marcha

## Archivos
- docs/hesed-administrativo.html: aplicación responsive para celular y escritorio.
- docs/HESED-SUPABASE-SCHEMA.sql: esquema base. Ejecutar primero.
- docs/HESED-ADMIN-OPERATIONS.sql: roles, cajas, evidencias, conciliación y auditoría. Ejecutar después.
- docs/HESED-ADMIN-SETUP.md: esta guía.

## Funciones incluidas
- Acceso privado mediante Supabase Auth, sin registro público.
- Dos propietarios con platform_admin y acceso a SHALOM, BEFIT y LA HUERTA.
- Roles por negocio: manager, accountant, receptionist, operator y viewer.
- Caja individual por recepcionista y turno; ingresos, gastos y ajustes.
- Cálculo de efectivo esperado y validación del servidor al entregar el corte.
- Revisión, aclaración y conciliación administrativa.
- Historial, exportación CSV y reportes mensuales.
- Importación Excel/CSV: selección de hoja y columna, comparación de totales y registro de cada conciliación.
- Tickets y comprobantes privados; OCR asistido para sugerir importes que siempre deben verificarse.
- Auditoría inmutable, sincronización Realtime y diseño móvil.

## Configuración obligatoria antes de usar dinero real
1. Crear un proyecto Supabase dedicado a HESED.
2. Ejecutar en SQL Editor docs/HESED-SUPABASE-SCHEMA.sql.
3. Ejecutar después docs/HESED-ADMIN-OPERATIONS.sql.
4. Desactivar el registro público en Supabase Auth. Invitar a los dos propietarios y al personal desde Authentication → Users → Invite user.
5. Copiar el UUID de cada propietario desde Authentication → Users y ejecutar por separado:

```sql
update public.profiles
set platform_role = 'platform_admin'
where user_id = 'UUID-DEL-PROPIETARIO'::uuid;
```

6. Abrir HESED → Personal y asignar cada empleado al negocio correspondiente. Roles: manager, accountant, receptionist, operator o viewer. No dar permisos globales a recepcionistas.
7. En el repositorio, activar GitHub Pages: Settings → Pages → Build and deployment → Deploy from a branch → main → /docs → Save. La API del repositorio reportaba Pages desactivado al preparar esta versión.
8. Abrir hesed-administrativo.html, elegir Configuración técnica e introducir Project URL y la clave pública anon/publishable. Nunca usar service_role en el navegador.
9. Probar cuentas distintas y confirmar aislamiento entre negocios y entre cajas de recepcionistas.
10. Probar apertura, movimientos, corte, diferencias, conciliación, carga/descarga de comprobantes, OCR, Excel y sincronización desde dos teléfonos.

## Alta de usuarios
Las cuentas se invitan desde Supabase Auth; el panel no permite auto-registro ni crea contraseñas. Después, en HESED → Personal, pega el UUID del usuario y asigna su rol en el negocio actual. Un usuario puede recibir membresía en más de un negocio.

## Modelo de caja
Cada recepcionista abre su propia sesión. El efectivo esperado se calcula como fondo inicial + ingresos en efectivo − gastos en efectivo, incluyendo ajustes según su dirección. Tarjeta y transferencias no forman parte del efectivo físico. Al entregar el corte, PostgreSQL recalcula el esperado. Los movimientos no se editan ni eliminan; cualquier corrección debe registrarse como un nuevo ajuste.

## Conservación y auditoría
Los movimientos y el historial de auditoría son inmutables. Las altas y cambios de estado de cortes, evidencias y asignaciones generan auditoría. Los comprobantes se guardan en el bucket privado hesed-evidence. Configura respaldos automáticos de Supabase según el plan contratado, copias externas cifradas y pruebas periódicas de restauración. Define la retención de comprobantes conforme a la política contable y legal de la alianza.

## Limitaciones que deben quedar claras
- El código está en el repositorio, pero el backend no está conectado: crear el proyecto Supabase, ejecutar SQL e invitar usuarios requiere acceso del propietario.
- No declarar producción hasta probar RLS, almacenamiento, sincronización y restauración con usuarios reales.
- El OCR es asistido, no infalible; el importe debe verificarse visualmente.
- Excel compara el total de la columna seleccionada contra movimientos HESED; no convierte automáticamente cada fila del Excel en movimiento contable. Validar el mapeo con el formato real antes de usarlo como conciliación oficial.
