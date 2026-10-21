# HESED · puesta en marcha del backend

## Alcance y estado actual
HESED es un sistema administrativo privado para los mismos dos propietarios de SHALOM, BEFIT y LA HUERTA. No se trabajará ahora en el sitio comercial, la tienda electrónica ni las reservas públicas de SHALOM.

El portal cuenta con manifiesto PWA y service worker básico para facilitar su instalación desde navegadores compatibles. Eso instala la carcasa web, no convierte los módulos existentes en una aplicación multiusuario. BEFIT y otros módulos aún guardan información local y no están listos para datos reales.

## Esquema backend
El archivo `HESED-SUPABASE-SCHEMA.sql` prepara una base PostgreSQL/Supabase con:
- Negocios separados: Shalom, Befit y La Huerta.
- Perfiles, membresías y roles por negocio.
- Sucursales, campañas, gastos, objetivos y socios de gimnasio.
- Row Level Security (RLS) para limitar el acceso por negocio.
- Registro de auditoría básico.

## Pasos necesarios para habilitar el sistema real
1. Crear un proyecto de Supabase dedicado a HESED y guardar las credenciales en un gestor seguro.
2. Ejecutar el SQL y comprobar que todas las funciones y políticas se aplicaron sin errores.
3. Desactivar el registro público en Supabase Auth. Invitar únicamente a los dos correos de los propietarios; no habrá registro de empleados ni clientes.
4. Asignar `platform_role = 'platform_admin'` a los dos perfiles de propietarios mediante el SQL Editor de Supabase después de que ambos usuarios se hayan creado. Los dos podrán administrar los tres negocios.
5. Configurar únicamente la URL del proyecto y la clave pública `anon`/publishable en los frontends. Nunca poner la clave `service_role` en el navegador.
6. Conectar autenticación, consultas y suscripciones Realtime en cada módulo. El esquema incluye una sección idempotente para agregar tablas operativas a `supabase_realtime` si esa publicación existe.
7. Migrar los datos locales mediante exportación, revisión y respaldo manual; no sobrescribir datos existentes.
8. Probar sesiones, permisos y cambios simultáneos desde dos dispositivos y dos cuentas de propietario, incluida la recuperación tras perder conexión.

## Seguridad y sincronización
- Las credenciales de ambos propietarios se gestionan mediante Supabase Auth; no se guardan contraseñas propias en HTML.
- El acceso debe estar cerrado por defecto y validado en servidor mediante RLS; ocultar enlaces no es seguridad.
- Realtime avisa a los demás dispositivos de cambios confirmados en la base de datos. La aplicación debe volver a consultar los registros al reconectarse para no perder cambios ocurridos durante una desconexión.
- No almacenar registros administrativos sensibles en caché offline. La PWA actual solo almacena una carcasa básica.
- Nunca incluir la clave `service_role` en HTML o JavaScript público.

## Criterios de aceptación antes de usar datos reales
- Ambos propietarios pueden entrar desde varios dispositivos; cualquier cuenta no invitada queda fuera.
- Crear/editar un gasto en un dispositivo se refleja en otro conectado en segundos.
- Los cambios se conservan tras cerrar sesión, reinstalar o cambiar de dispositivo.
- Los tres negocios mantienen datos separados; no hay registros de ejemplo presentados como reales.
- Se verifican exportación, respaldo, errores de conexión y permisos en producción.
