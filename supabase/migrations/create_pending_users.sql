/*
  # Crear tabla temporal "pending_users" para datos de registro

  1. Nueva tabla
    - pending_users
      - id: serial primary key
      - email: text, único, no nulo
      - full_name: text, no nulo
      - phone: text, no nulo
      - created_at: timestamptz, default now()

  2. Notas
    - Se usa para guardar datos de registro antes de que el usuario confirme su email y se cree en auth.users
    - Al hacer login, si el usuario no existe en "users", se busca por email en "pending_users" y se migra la info
*/

create table if not exists pending_users (
  id serial primary key,
  email text unique not null,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
