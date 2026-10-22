# HESED — plan de pruebas de la versión local

## Propósito

Validar primero la experiencia local de HESED antes de conectar Supabase. Esta lista no certifica que las pruebas ya se hayan ejecutado; sirve como protocolo reproducible para Windows y navegadores compatibles.

## Alcance de esta iteración

- Mantener ASSOSIATED 163 como módulo operativo de SHALOM.
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
| LOC-03 | Entrar en SHALOM | Se abre el panel basado en ASSOSIATED 163 y las funciones conservadas siguen accesibles. |
| LOC-04 | Crear campaña de prueba en SHALOM | La campaña se guarda y aparece después de navegar a otra sección y regresar. |
| LOC-05 | Cambiar a BEFIT y a LA HUERTA | El cambio de empresa funciona y no muestra por defecto registros de prueba de SHALOM. |
| LOC-06 | Crear un registro de prueba en cada área que lo permita | Los registros de cada área permanecen separados. Anotar las funciones que aún sean solo un marcador o prototipo. |
| LOC-07 | Cerrar y volver a abrir el archivo en el mismo navegador | Los datos locales continúan disponibles en ese mismo perfil de navegador. |
| LOC-08 | Exportar respaldo, limpiar solo los datos de prueba y reimportar | El respaldo recupera los datos esperados sin duplicarlos ni mezclar empresas. |
| LOC-09 | Registrar un gasto con comprobante ficticio en SHALOM | El movimiento aparece en la lista y el comprobante abre en el mismo dispositivo. |
| LOC-10 | Revisar datos de ejemplo | Los datos DEMO están identificados claramente y no se confunden con información real. |
| LOC-11 | Probar ancho móvil y escritorio | No hay controles cortados ni tablas inutilizables; se puede navegar con teclado y ratón. |
| LOC-12 | Revisar consola del navegador | No aparecen errores que impidan guardar, navegar, exportar o importar. |

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
3. Una función preexistente de ASSOSIATED 163 que haya dejado de operar.
4. Un comprobante que se marque como guardado pero no pueda recuperarse.
5. Errores de consola que impidan una operación crítica.

## Siguiente etapa después de aprobar las pruebas locales

Conectar Supabase Auth y las tablas protegidas por RLS; invitar únicamente a los dos propietarios; conectar cada módulo al identificador de negocio correcto; después probar sincronización entre dos dispositivos y recuperación tras una desconexión. No migrar datos reales sin exportar y verificar primero un respaldo.
