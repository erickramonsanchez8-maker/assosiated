# HESED — plan de pruebas de la versión local

## Propósito

Validar primero la experiencia local de HESED antes de conectar Supabase. Esta lista no certifica que las pruebas ya se hayan ejecutado; sirve como protocolo reproducible para Windows y navegadores compatibles.

## Alcance de esta iteración

- Mantener módulo administrativo de SHALOM como módulo operativo de SHALOM.
- Entrar desde una bienvenida común de HESED y seleccionar SHALOM, BEFIT o LA HUERTA.
- Conservar datos locales separados por empresa.
- No modificar ni reemplazar el producto agrícola AGROVA / Mi Parcela.
- Mantener aparte la web pública, tienda y reservas públicas de SHALOM.
- No introducir credenciales reales ni información sensible durante las pruebas.

## Preparación

1. Descargar o clonar la rama `feature/hesed-local-workspace`.
2. Abrir `HESED_LOCAL.html` en un navegador actualizado en Windows.
3. Usar datos ficticios con el prefijo `PRUEBA-`.
4. Antes de probar, guardar una copia del archivo y exportar cualquier respaldo disponible.
5. Registrar navegador, fecha, resultado y evidencia de cada prueba.

## Casos de aceptación

| ID | Prueba | Resultado esperado |
| --- | --- | --- |
| LOC-01 | Abrir el HTML | La pantalla carga sin errores visibles y la navegación responde. |
| LOC-02 | Abrir la bienvenida de HESED | Se muestran SHALOM, BEFIT y LA HUERTA y se puede volver al selector. |
| LOC-03 | Entrar en SHALOM | Se abre el panel basado en módulo administrativo de SHALOM y las funciones conservadas siguen accesibles. |
| LOC-04 | Crear campaña de prueba en SHALOM | La campaña se guarda y aparece después de navegar a otra sección y regresar. |
| LOC-05 | Cambiar a BEFIT y a LA HUERTA | El cambio de empresa funciona y no muestra por defecto registros de prueba de SHALOM. |
| LOC-06 | Crear un registro de prueba en cada área que lo permita | Los registros de cada área permanecen separados. Anotar las funciones que aún sean solo un marcador o prototipo. |
| LOC-06A | Registrar asistencia en BEFIT para un socio de prueba | La asistencia queda asociada al socio correcto y persiste al cambiar de pestaña y regresar. |
| LOC-06B | Registrar un pago en BEFIT | El pago conserva socio, concepto, fecha, método e importe; se exporta correctamente a CSV y respaldo JSON. |
| LOC-07 | Cerrar y volver a abrir el archivo en el mismo navegador | Los datos locales continúan disponibles en ese mismo perfil de navegador. |
| LOC-08 | Exportar respaldo, limpiar solo los datos de prueba y reimportar | El respaldo recupera los datos esperados sin duplicarlos ni mezclar empresas. |
| LOC-09 | Registrar un gasto con comprobante ficticio en SHALOM | El movimiento aparece en la lista y el comprobante abre en el mismo dispositivo. |
| LOC-10 | Revisar datos de ejemplo | Los datos DEMO están identificados claramente y no se confunden con información real. |
| LOC-11 | Probar ancho móvil y escritorio | No hay controles cortados ni tablas inutilizables; se puede navegar con teclado y ratón. |
| LOC-12 | Revisar consola del navegador | No aparecen errores que impidan guardar, navegar, exportar o importar. |
| LOC-13 | Descargar y restaurar un respaldo JSON de BEFIT | Se recuperan socios, gastos, campañas y objetivos tras confirmar el reemplazo; el módulo valida el formato antes de restaurar. |
| LOC-14 | Restaurar un respaldo BEFIT anterior | Se acepta el formato anterior generado por este módulo, siempre que tenga las cuatro colecciones esperadas; no se importan respaldos identificados como otra empresa. |
| LOC-15 | Revisar sintaxis de scripts en los cinco HTML principales | Los scripts de HESED_LOCAL, portal, SHALOM, BEFIT y Mi Parcela se pueden analizar sin errores de sintaxis antes de las pruebas manuales. |
| LOC-16 | Exportar CSV de BEFIT con texto que comience por `=`, `+`, `-` o `@` | El CSV neutraliza esas celdas para reducir el riesgo de que Excel/hojas de cálculo las interpreten como fórmulas. |
| LOC-17 | Eliminar un socio con asistencias o pagos vinculados | El sistema pide confirmación y elimina también los registros dependientes para no dejar referencias huérfanas. |
| LOC-18 | Abrir BEFIT desde HESED_LOCAL y volver con el enlace superior | El retorno conduce a HESED_LOCAL; si BEFIT se abre desde el directorio de `docs/`, el retorno conduce a ese directorio. |
| LOC-19 | Hacer corte de caja con ingresos y gastos de efectivo | Para una fecha y sucursal, el efectivo esperado es fondo inicial + pagos en efectivo − gastos en efectivo; la diferencia es efectivo contado − esperado. |
| LOC-20 | Hacer corte con pagos por transferencia/tarjeta | Esos pagos no incrementan el efectivo esperado, aunque aparecen dentro del total de todos los métodos para referencia. |
| LOC-21 | Guardar, exportar y restaurar cortes de caja | El historial de cortes persiste, se exporta a CSV y se conserva al restaurar un respaldo BEFIT nuevo. Los respaldos anteriores abren con historial vacío. |
| LOC-22 | Revisar datos antiguos sin método/sucursal | Los registros históricos incompletos no deben contarse como efectivo ni asignarse automáticamente a una sucursal; se revisan antes del corte. |

## Límites que deben permanecer visibles

- El almacenamiento local pertenece al navegador/perfil y dispositivo donde se capturan los datos; no se sincroniza entre equipos.
- Los comprobantes guardados en IndexedDB también permanecen en ese dispositivo y perfil.
- El inicio de sesión local heredado no equivale a autenticación segura de servidor ni debe considerarse protección para datos reales.
- La instalación como PWA, si el navegador la permite, instala la interfaz; no crea por sí sola una base de datos compartida.
- No conectar ni declarar listo Supabase hasta completar las pruebas locales, revisar el esquema y confirmar las credenciales de configuración pública permitidas.
- Nunca incluir una clave `service_role`, contraseñas reales ni tokens privados en el HTML o en el repositorio.

## Bloqueadores para dar por aprobada esta iteración

1. Cualquier pérdida de datos al navegar o reabrir el archivo.
2. Cualquier mezcla visible de registros entre empresas.
3. Una función preexistente de módulo administrativo de SHALOM que haya dejado de operar.
4. Un comprobante que se marque como guardado pero no pueda recuperarse.
5. Errores de consola que impidan una operación crítica.

## Siguiente etapa después de aprobar las pruebas locales

Conectar Supabase Auth y las tablas protegidas por RLS; invitar únicamente a los dos propietarios; conectar cada módulo al identificador de negocio correcto; después probar sincronización entre dos dispositivos y recuperación tras una desconexión. No migrar datos reales sin exportar y verificar primero un respaldo.


## Accesos e identidad visual (LOC-23 a LOC-29)

| ID | Prueba | Resultado esperado |
|---|---|---|
| LOC-23 | Abrir HESED sin cuentas guardadas | Solicita crear el primer acceso del propietario; no abre directamente una unidad. |
| LOC-24 | Cerrar sesión de HESED e iniciar con usuario/contraseña incorrectos | Rechaza el acceso y no muestra el selector de empresas. |
| LOC-25 | Desde HESED, abrir SHALOM | Solicita credenciales propias de SHALOM antes de mostrar el panel. |
| LOC-26 | Desde HESED, abrir BEFIT | Solicita credenciales propias de BEFIT; la interfaz conserva su identidad verde/mint. |
| LOC-27 | Desde HESED, abrir LA HUERTA | Abre el módulo existente de Mi Parcela, que solicita su propio acceso; no presenta una segunda pantalla genérica de HESED y conserva el flujo agrícola. |
| LOC-28 | Agregar el segundo propietario en HESED y en cada unidad | El segundo propietario puede entrar con sus credenciales individuales; cada unidad conserva sus propias cuentas. |
| LOC-29 | Abrir BEFIT directamente sin sesión temporal válida | Muestra su pantalla de acceso; no deja visible el módulo hasta validar credenciales. |

**Nota de seguridad:** estas puertas de acceso son un prototipo local. El almacenamiento del navegador y los hashes en el cliente no reemplazan autenticación de servidor, sesiones seguras ni permisos de base de datos. No tratar como control de acceso de producción.

## LOC-30 a LOC-35 · Identidad premium e integración de Mi Parcela

| ID | Prueba | Resultado esperado |
|---|---|---|
| LOC-30 | Abrir HESED y recorrer Inicio, acceso y administración | Paleta carbón, marfil y champán consistente; controles legibles y contraste suficiente. |
| LOC-31 | Pasar el cursor por tarjetas, botones y navegación | Transiciones discretas, sin saltos de contenido ni animaciones que bloqueen la interacción. |
| LOC-32 | Entrar a LA HUERTA desde HESED | Mi Parcela se abre dentro de la misma página, sin navegar a `docs/hesed-huerta.html`. |
| LOC-33 | Revisar los módulos agrícolas integrados | Parcelas, siembras, producción, inventario, finanzas, recordatorios y administración siguen accesibles. |
| LOC-34 | Abrir Inicio y Mis campos | No aparece el motor, el lienzo ni la visualización 3D de parcelas; los datos y la gestión de parcelas siguen disponibles. |
| LOC-35 | Registrar un dato ficticio en Mi Parcela, cambiar de módulo y volver | El registro persiste y no aparece en SHALOM ni BEFIT. Confirmar también al cerrar y volver a abrir la aplicación. |

**Nota de integración:** el código de Mi Parcela se incorpora dentro de `HESED_LOCAL.html` para que el usuario pueda probarlo como una sola página. La visualización 3D de parcelas se excluye únicamente de esta versión integrada; el archivo independiente `docs/hesed-huerta.html` se conserva como fuente original. La integración y los flujos requieren pruebas manuales en Edge/Chrome antes de usar información real.

