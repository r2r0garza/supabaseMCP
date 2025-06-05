/*
  # Agregar columna "role" a la tabla users

  1. Modificaciones
    - Se agrega la columna "role" (tipo text) a la tabla "users"
    - Valor por defecto: 'cliente'
    - Permite distinguir entre usuarios "admin" y "cliente"

  2. Seguridad
    - No se modifican políticas de RLS, pero se recomienda ajustar políticas para restringir acceso a la consola de administración según el rol

  3. Notas
    - Para convertir un usuario en admin, basta con actualizar el campo "role" a 'admin' en la fila correspondiente
*/

alter table users
  add column if not exists role text not null default 'cliente';

comment on column users.role is 'Rol del usuario: admin o cliente. Por defecto es cliente.';
