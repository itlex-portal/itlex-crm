-- ================================================================
-- ITLEX CRM — Esquema de base de datos para Supabase
-- Correr este SQL en: Supabase → SQL Editor → New query → Run
-- ================================================================

-- Tabla de perfiles (roles: admin | client)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'client')),
  client_id uuid,
  created_at timestamp with time zone default now()
);
alter table profiles enable row level security;
create policy "Usuarios ven su propio perfil" on profiles for select using (auth.uid() = id);
create policy "Admin lee todos los perfiles" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Tabla de clientes
create table clientes (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  empresa text,
  email text,
  telefono text,
  notas text,
  created_at timestamp with time zone default now()
);
alter table clientes enable row level security;
create policy "Admin gestiona clientes" on clientes for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Cliente ve su registro" on clientes for select using (
  id in (select client_id from profiles where id = auth.uid())
);

-- Tabla de garantías
create table garantias (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  descripcion text,
  fecha_inicio date,
  fecha_vencimiento date,
  monto numeric,
  status text default 'activo' check (status in ('activo', 'vencido', 'renovado')),
  created_at timestamp with time zone default now()
);
alter table garantias enable row level security;
create policy "Admin gestiona garantías" on garantias for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Cliente ve sus garantías" on garantias for select using (
  cliente_id in (select client_id from profiles where id = auth.uid())
);

-- Tabla de licitaciones
create table licitaciones (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  numero_expediente text,
  entidad text,
  monto_estimado numeric,
  fecha_publicacion date,
  fecha_cierre date,
  status text default 'en_proceso' check (status in ('en_proceso', 'adjudicado', 'perdido')),
  oportunidad text,
  created_at timestamp with time zone default now()
);
alter table licitaciones enable row level security;
create policy "Admin gestiona licitaciones" on licitaciones for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Cliente ve sus licitaciones" on licitaciones for select using (
  cliente_id in (select client_id from profiles where id = auth.uid())
);

-- Tabla de subsanes
create table subsanes (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade,
  descripcion text not null,
  origen text,
  fecha_limite date,
  status text default 'abierto' check (status in ('abierto', 'resuelto')),
  notas text,
  created_at timestamp with time zone default now()
);
alter table subsanes enable row level security;
create policy "Admin gestiona subsanes" on subsanes for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Cliente ve sus subsanes" on subsanes for select using (
  cliente_id in (select client_id from profiles where id = auth.uid())
);

-- ================================================================
-- DESPUÉS de crear el esquema:
-- 1. Ve a Supabase → Authentication → Settings → Email
-- 2. Desactiva "Confirm email" para facilitar las pruebas
-- 3. Crea tu primer usuario admin:
--    INSERT INTO auth.users ... (usa el dashboard de Supabase)
--    O regístrate con signUp y luego corre:
--    INSERT INTO profiles (id, role) VALUES ('TU_USER_ID', 'admin');
-- ================================================================
