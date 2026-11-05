# BEFIT · Control financiero y conciliación

## Qué incluye esta entrega
- Pestaña **Control financiero** dentro de BEFIT.
- Importación de archivos .xlsx, .xls y .csv con asistente de mapeo de columnas.
- Perfiles de mapeo guardados por sucursal y origen (recepción / administración).
- Conservación de los dos archivos originales en IndexedDB, junto con SHA-256 para detectar reimportaciones.
- Conciliación por movimiento usando fecha, sucursal, concepto, método y referencia; compara importes en centavos y reconoce formatos `1,234.56` y `1.234,56`.
- La importación guarda una conciliación inicial automáticamente; es posible volver a ejecutarla por sucursal después de revisar los datos.
- Detección de movimientos faltantes, importes distintos y posibles duplicados por identidad del movimiento, incluso cuando el importe difiere. Las diferencias compensadas permanecen visibles por movimiento.
- Historial de importaciones, versiones de conciliación y bitácora de auditoría.
- Corte de caja diario por sucursal con captura manual o importación de múltiples cortes desde XLSX/XLS/CSV mediante mapeo de columnas; fondo inicial, ingresos por forma de pago, gastos en efectivo, efectivo esperado, efectivo contado, diferencias, historial y exportación CSV.
- El lote importado conserva el archivo original, su huella SHA-256, el mapeo aplicado y la relación de cada corte con su archivo fuente. La restauración JSON incluye también esos originales.
- Reporte mensual descargable en CSV e imprimible/guardable como PDF desde el navegador.
- Escáner OCR en español para tickets; guarda la imagen original, el texto OCR y los campos editables para revisión.

## Prueba rápida
1. Abre [BEFIT](https://erickramonsanchez8-maker.github.io/assosiated/befit.html) desde el portal HESED o directamente.
2. Entra en **Control financiero**.
3. Escribe Centro en sucursal.
4. Importa primero test-data/befit-recepcion-prueba.csv como archivo de recepción y después test-data/befit-administracion-prueba.csv como archivo administrativo.
5. Confirma el mapeo de columnas y pulsa **Guardar e importar**. El sistema conserva los originales, detecta reimportaciones y genera una primera conciliación automáticamente.
6. Comprueba coincidencias, diferencias de importe, faltantes y duplicados. Los servicios A/B demuestran diferencias que se compensan en el total, pero que siguen detectadas individualmente. **Ejecutar conciliación** permite recalcular la sucursal escrita en el campo correspondiente.
7. Genera el reporte mensual de noviembre de 2026 y descarga el CSV.
8. Captura un corte diario manual y comprueba el efectivo esperado y la diferencia.
9. En **Importar cortes de caja desde Excel / CSV**, carga un archivo de prueba con columnas de fecha, sucursal, efectivo contado y, cuando existan, fondo inicial, ventas en efectivo, tarjeta, transferencias, otros ingresos y gastos. Confirma el mapeo y pulsa **Importar cortes**.
10. Comprueba que cada corte importado indique su archivo de origen en el CSV de historial y que no permita reimportar el mismo archivo.
11. Imprime/guarda el corte y el reporte mensual como PDF; prueba el respaldo/restauración JSON.
12. Prueba el escáner con una foto de ticket legible. Revisa y corrige los campos antes de guardar.

## Alcance y límites importantes
- Esta versión conserva datos localmente en el navegador/dispositivo; no sincroniza entre propietarios ni sucursales.
- La carga de SheetJS y Tesseract.js requiere conexión a internet la primera vez.
- OCR es asistivo, no una validación fiscal ni contable. El usuario debe revisar cada dato.
- La tolerancia de conciliación es exacta ($0.00). La comparación por referencia/concepto no sustituye reglas específicas por sucursal.
- Los cortes diarios se pueden capturar manualmente o importar desde un archivo XLSX/XLS/CSV exportado por el sistema administrativo. Esto no es una conexión automática al POS ni sustituye la integración con su API; los encabezados y totales deben revisarse al mapear el archivo. El módulo no bloquea ni reabre cierres con autorización.
- La exportación PDF usa el diálogo de impresión del navegador; no genera archivos PDF en segundo plano.
- El historial conserva versiones anteriores de conciliación. La bitácora registra importaciones, conciliaciones y tickets guardados.
- Los datos monetarios se almacenan en centavos enteros. El parser contempla separadores decimales y de miles mexicanos/europeos; revisa la vista previa y los totales antes de confirmar.
- Antes de usar con información real, prueba en un perfil de navegador limpio y exporta respaldos. No es aún un sistema multiusuario de producción.

## Validación automatizada
- GitHub Actions ejecuta `node --check docs/befit-control.js` y `node scripts/test-befit-control.mjs`.
- Las pruebas smoke verifican sintaxis, integración HTML/script y resultados esperados de los CSV sintéticos; no sustituyen una prueba E2E en navegador.
