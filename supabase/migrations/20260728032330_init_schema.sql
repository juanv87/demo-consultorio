create table profesionales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  especialidad text,
  duracion_consulta_minutes integer not null default 30,
  hora_inicio time not null default '09:00',
  hora_fin time not null default '18:00',
  atiende_sabados boolean default false,
  atiende_domingos boolean default false
);

create table pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text unique not null,
  email text,
  created_at timestamptz default now()
);

create table turnos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id),
  profesional_id uuid references profesionales(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmado', -- confirmado / cancelado
  recordatorio_enviado boolean not null default false,
  created_at timestamptz default now()
);

create table conversaciones_activas (
  telefono text primary key,
  estado text not null, -- esperando_horario | esperando_nombre | confirmando_cancelacion |
                         -- eligiendo_profesional | esperando_confirmacion_email | esperando_email
  contexto jsonb,
  updated_at timestamptz default now()
);

-- Proteccion anti double-booking (requiere btree_gist en schema public)
create extension btree_gist with schema public;

alter table turnos add constraint turnos_no_solapamiento
exclude using gist (
  profesional_id with =,
  tstzrange(start_time, end_time) with &&
) where (status = 'confirmado');

-- Historial completo de conversacion (para el futuro dashboard/CRM)
create table mensajes (
  id uuid primary key default gen_random_uuid(),
  telefono text not null,
  remitente text not null, -- 'paciente' | 'bot' | 'humano' (este ultimo, sin usar aun)
  contenido text not null,
  created_at timestamptz default now()
);

alter table mensajes enable row level security;

-- Policy para la pagina /demo (dashboard): el chat embebido genera un
-- telefono de demo por sesion de browser (prefijo fijo + sufijo random --
-- ver dashboard/src/lib/demoTelefono.ts). Sin esta policy, con RLS
-- activado y sin politicas, un select con la anon key devolveria vacio;
-- sin RLS, devolveria el historial completo de cualquier telefono. Se
-- filtra por prefijo (en vez de por un telefono exacto) para no abrir la
-- tabla entera a la anon key, permitiendo igual que cada sesion use un
-- telefono distinto y no se pisen pacientes entre pruebas. Hoy el
-- dashboard lee `mensajes` server-side con la service role, no con la
-- anon key -- esta policy queda lista para si en el futuro se agrega un
-- cliente Supabase de browser.
create policy "select_demo_conversation"
on mensajes for select
to anon
using (telefono like '+549demo%');
