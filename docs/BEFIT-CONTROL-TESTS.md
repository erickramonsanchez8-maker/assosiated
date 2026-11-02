# BEFIT · Control financiero y conciliación

## Qué incluye esta entrega
- Pestaña **Control financiero** dentro de BEFIT.
- Importación de archivos .xlsx, .xls y .csv con asistente de mapeo de columnas.
- Perfiles de mapeo guardados por sucursal y origen (recepción / administración).
- Conservación de los dos archivos originales en IndexedDB, junto con SHA-256 para detectar reimportaciones.
- Conciliación por movimiento usando fecha, sucursal, concepto, método y referencia; compara importes en centavos.
- Detección de movimientos faltantes, importes distintos y duplicados. Las diferencias compensadas permanecen visibles por movimiento.
- Historial de importaciones, versiones de conciliación y bitácora de auditoría.
- Corte de caja diario por sucursal con fondo inicial, ingresos por forma de pago, gastos en efectivo, efectivo esperado, efectivo contado, diferencias, historial y exportación CSV.\n- Reporte mensual descargable en CSV e imprimible/guardable como PDF desde el navegador.
- Escáner OCR en español para tickets; guarda la imagen original, el texto OCR y los campos editables para revisión.

## Prueba rápida
1. Abre [BEFIT](https://erickramonsanchez8-maker.github.io/assosiated/befit.html) desde el portal HESED o directamente.
2. Entra en **Control financiero**.
3. Escribe Centro en sucursal.
4. Importa primero test-data/befit-recepcion-prueba.csv como archivo de recepción y después test-data/befit-administracion-prueba.csv como archivo administrativo.
5. Confirma el mapeo de columnas y pulsa **Guardar e importar**.
6. Pulsa **Ejecutar conciliación**. Deben aparecer coincidencias, diferencias de importe, faltantes y duplicados. Los servicios A/B demuestran diferencias que se compensan en el total, pero que siguen detectadas individualmente.
7. Genera el reporte mensual de noviembre de 2026 y descarga el CSV.
8. Captura un corte diario, guarda y comprueba el efectivo esperado y la diferencia.\n9. Imprime/guarda el corte y el reporte mensual como PDF; exporta el historial de cortes a CSV.\n10. Prueba el escáner con una foto de ticket legible. Revisa y corrige los campos antes de guardar.

## Alcance y límites importantes
- Esta versión conserva datos localmente en el navegador/dispositivo; no sincroniza entre propietarios ni sucursales.
- La carga de SheetJS y Tesseract.js requiere conexión a internet la primera vez.
- OCR es asistivo, no una validación fiscal ni contable. El usuario debe revisar cada dato.
- La tolerancia de conciliación es exacta ($0.00). La comparación por referencia/concepto no sustituye reglas específicas por sucursal.
- El corte diario es independiente del flujo operativo y no bloquea ni reabre cierres con autorización.\n- La exportación PDF usa el diálogo de impresión del navegador; no genera archivos PDF en segundo plano.
- El historial conserva versiones anteriores de conciliación. La bitácora registra importaciones, conciliaciones y tickets guardados.
- Antes de usar con información real, prueba en un perfil de navegador limpio y exporta respaldos. No es aún un sistema multiusuario de producción.
\n## Validación automatizada\n- GitHub Actions ejecuta `node --check docs/befit-control.js` y `node scripts/test-befit-control.mjs`.\n- Las pruebas smoke verifican sintaxis, integración HTML/script y resultados esperados de los CSV sintéticos; no sustituyen una prueba E2E en navegador.\n