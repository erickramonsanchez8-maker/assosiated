# HESED — pendientes para liberar a producción

Este documento separa lo que ya está en el repositorio de lo que requiere acceso del propietario o decisiones de negocio.

## Requiere una acción del propietario

### 1. Repositorio independiente de SHALOM
Crear un repositorio vacío llamado `shalom-web` en GitHub. El conector de GitHub disponible en esta sesión no tiene una operación para crear repositorios nuevos. Después de crearlo, se podrá trasladar `shalom-web/index.html`, `shalom-web/shalom-tienda.html` y el README a su raíz, copiar el logotipo y configurar GitHub Pages.

### 2. Proyecto de backend
Crear un proyecto Supabase dedicado a HESED. Aplicar y revisar `HESED-SUPABASE-SCHEMA.sql` en el SQL Editor. Compartir únicamente la URL del proyecto y la clave pública anon/publishable si se quiere que prepare la conexión frontend. **Nunca enviar la clave `service_role`, contraseñas ni tokens privados.**

### 3. Datos oficiales de SHALOM
- Dirección y enlace de Google Maps.
- WhatsApp internacional (solo dígitos con lada), teléfono e Instagram.
- Horarios oficiales de brunch y dinner.
- Carta real con nombres, descripciones, precios, disponibilidad y fotografías autorizadas.
- Confirmación de si reservas y pedidos deben abrir WhatsApp o si necesitan una bandeja de pedidos dentro de HESED.

### 4. Datos operativos de BEFIT y LA HUERTA
- Nombre de las sucursales y planes reales de BEFIT.
- Qué datos del socio se deben guardar y quién puede verlos.
- Campos reales de parcelas, cultivos, labores, cosechas, inventario y costos de La Huerta. No migrar registros de Mi Parcela automáticamente hasta mapearlos.

## Trabajo ya preparado en el repositorio
- Portal central HESED y copias del panel ASSOCIATED y Mi Parcela.
- Módulo inicial BEFIT con socios, gastos, campañas, objetivos, CSV y respaldo JSON local.
- Esquema inicial de base de datos con separación por negocio y políticas RLS.
- Sitio principal y tienda de SHALOM en una carpeta separada, con enlaces y logos actualizados.

## No declarar listo para producción todavía
La autenticación central y la base de datos no están desplegadas ni conectadas a los frontends. BEFIT aún guarda en el navegador. No se han ejecutado pruebas visuales de navegador ni pruebas de seguridad contra un backend real.
