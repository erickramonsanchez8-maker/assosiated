# HESED · puesta en marcha del backend

## Estado actual
Los módulos estáticos están publicados en GitHub Pages. BEFIT guarda los datos de esta primera versión en el navegador. Eso sirve para prototipar, no para operar con varios usuarios o equipos.

## Esquema backend
El archivo `HESED-SUPABASE-SCHEMA.sql` prepara una base PostgreSQL/Supabase con:
- Negocios separados: Shalom, Befit y La Huerta.
- Perfiles, membresías y roles por negocio.
- Sucursales, campañas, gastos, objetivos y socios de gimnasio.
- Row Level Security (RLS) para limitar el acceso por negocio.
- Registro de auditoría básico.

## Pasos que requieren acceso del propietario
1. Crear un proyecto de Supabase y guardar las credenciales en un gestor seguro.
2. Ejecutar el SQL en el editor de Supabase y revisar las políticas antes de cargar datos reales.
3. Crear la cuenta administradora y asignar membresías iniciales mediante un proceso administrativo seguro. No se debe permitir que un usuario se eleve a administrador desde el navegador.
4. Configurar variables de entorno para la URL y la clave pública de Supabase en cada frontend.
5. Migrar los datos locales mediante exportación y revisión manual; no sobrescribir datos existentes.
6. Probar permisos con cuentas separadas de Shalom, Befit y La Huerta, incluyendo intentos de lectura cruzada.

## Seguridad
Nunca incluir la clave `service_role` en HTML o JavaScript público. Las contraseñas se gestionan mediante Supabase Auth; no almacenar contraseñas propias en el frontend.
