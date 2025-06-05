/*
  # Permitir INSERT en la tabla users para el usuario autenticado

  1. Seguridad
    - Permite que los usuarios autenticados creen su propio perfil (id = auth.uid())
    - No permite que un usuario cree perfiles para otros usuarios

  2. Notas
    - Es fundamental para que el flujo de registro y migración funcione correctamente
*/

-- Habilitar RLS si no está habilitado
alter table users enable row level security;

-- Permitir INSERT solo si el id coincide con el usuario autenticado (usar WITH CHECK)
create policy "Authenticated users can insert their own profile"
  on users
  for insert
  to authenticated
  with check (id = auth.uid());
