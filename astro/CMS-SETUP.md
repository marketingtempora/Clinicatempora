# CMS de formularios de Clínica Témpora

El CMS vive en `/CMS/`. La página no contiene contraseñas ni claves administrativas.

## Activación

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor**, pegar `supabase/schema.sql` y ejecutarlo.
3. En **Authentication > Providers > Email**, desactivar el registro público de usuarios.
4. En **Authentication > Users**, crear el usuario interno con correo verificado y una contraseña única y larga.
5. Autorizarlo en **SQL Editor**, reemplazando el correo:

   ```sql
   insert into public.cms_users (user_id)
   select id from auth.users
   where lower(email) = lower('correo-autorizado@dominio.cl')
   on conflict (user_id) do nothing;
   ```

6. En Render configurar `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`, y desplegar de nuevo.

La `service_role` no se agrega al frontend ni a Render. Si Make necesita actualizar estados, esa clave se conserva sólo dentro de la conexión segura de Make.

## Qué queda respaldado

- Los ocho campos visibles de LP1 y LP2.
- La landing de origen (`lp1` o `lp2`).
- Todas las UTM e identificadores publicitarios.
- URL, referente, fecha e identificador único de envío.
- Estado de Make/Pipedrive, intentos e información de error.

El formulario intenta guardar en Supabase antes de llamar a Make. Así, un fallo posterior de Make o Pipedrive no elimina el registro del CMS.
