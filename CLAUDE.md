# Odonto Demo — Automatización de atención al cliente (WhatsApp + n8n)

> Última actualización: 19 de julio de 2026
> Demo de venta para la línea de negocio "automatización IA-first" de la
> agencia (ver `agencia-contexto.md` para el contexto general del negocio).
> Caso de uso: consultorio médico (Dra. Pérez, ficticia) — agendar, cancelar,
> responder preguntas y contener consultas médicas vía WhatsApp.

## Qué es esto

Un flujo de n8n que simula un asistente de WhatsApp para un consultorio,
capaz de: agendar turnos, cancelarlos, responder preguntas frecuentes, y
contener (derivando a un humano) consultas de tipo médico/urgente. Pensado
como demo de venta, no como producto terminado — reutilizable como base
para peluquerías, talleres, estudios jurídicos u otros negocios chicos con
el mismo patrón de "mucho teléfono, poca gente atendiendo".

## Stack

- **Orquestación**: n8n, corriendo local (`npx n8n`), sin hosting pago
  todavía — no es necesario para un demo (ver sección Infraestructura)
- **Canal de entrada (demo)**: n8n Chat Trigger, para pruebas rápidas sin
  necesidad de WhatsApp real todavía
- **Canal de entrada (futuro, para venta real)**: WhatsApp Business API
  (Meta Cloud API o Twilio) — no implementado aún
- **IA**: Anthropic API (nodo nativo), Haiku para clasificación de
  intención, mismo modelo para responder preguntas con contexto inyectado
- **Base de datos**: Supabase (proyecto separado, "Demo Odonto"), acceso
  vía nodo **Postgres** de n8n (no el nodo Supabase nativo — más limitado,
  no soporta upsert/queries complejas)
- **Email**: Gmail (OAuth2), para avisos al consultorio en casos urgentes

## Schema de base de datos

```sql
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
  created_at timestamptz default now()
);

create table turnos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id),
  profesional_id uuid references profesionales(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmado', -- confirmado / cancelado
  created_at timestamptz default now()
);

create table conversaciones_activas (
  telefono text primary key,
  estado text not null, -- esperando_horario | esperando_nombre | confirmando_cancelacion
  contexto jsonb,
  updated_at timestamptz default now()
);

-- Protección anti double-booking (requiere btree_gist en schema public)
create extension btree_gist with schema public;

alter table turnos add constraint turnos_no_solapamiento
exclude using gist (
  profesional_id with =,
  tstzrange(start_time, end_time) with &&
) where (status = 'confirmado');
```

## Arquitectura del flujo (n8n)

```
Webhook (o Chat Trigger, para pruebas) → normalización de input
  → Postgres: consultar estado en conversaciones_activas
    → Switch (dispatcher por estado):

    ├─ "" (sin conversación activa)
    │   → Clasificador IA (intención: AGENDAR/CANCELAR/PREGUNTA/URGENTE)
    │     → Switch (por intención):
    │        ├─ AGENDAR → calcular horarios disponibles → guardar estado
    │        │             "esperando_horario" → responder con lista numerada
    │        ├─ CANCELAR → buscar turno activo → si existe, guardar estado
    │        │             "confirmando_cancelacion" → pedir confirmación SI/NO
    │        ├─ PREGUNTA → responder con contexto real del consultorio
    │        │             (sin dar consejo médico)
    │        └─ URGENTE → mensaje fijo de contención + email al consultorio
    │
    ├─ "esperando_horario"
    │   → validar número elegido (1-5) → guardar horario + estado
    │     "esperando_nombre" → pedir nombre
    │     (si el número es inválido, repetir sin cambiar estado)
    │
    ├─ "esperando_nombre"
    │   → upsert paciente + insert turno (protegido por constraint) →
    │     si hay conflicto (double-booking): avisar y no borrar estado
    │     si OK: borrar conversaciones_activas → confirmar turno
    │
    └─ "confirmando_cancelacion"
        → interpretar SI/NO → si SI: cancelar turno (status='cancelado')
          → borrar conversaciones_activas → confirmar
```

## Convenciones aprendidas (importantes para no repetir errores ya resueltos)

- **Comparaciones de texto en Switch/IF**: usar siempre `contains`, nunca
  `equals` — la IA a veces agrega espacios o caracteres invisibles que
  rompen comparaciones exactas.
- **Referencias entre nodos**: `$json` solo refleja la salida del nodo
  **inmediatamente anterior**. Para traer datos de un nodo más atrás en la
  cadena, siempre usar `$('Nombre exacto del nodo').first().json...`.
- **Nodos Postgres de solo escritura** (insert/update/delete sin
  `RETURNING` útil) devuelven `{success: true}` — es normal. El mensaje de
  respuesta al usuario nunca sale de ahí; siempre se arma en un nodo Set
  dedicado justo antes de responder, o se referencia por nombre al nodo
  Code/Set original que lo generó.
- **Campo de salida estandarizado**: todo mensaje de respuesta al usuario
  usa el campo `output` (no `respuesta`, `mensaje_texto`, etc.) — esto es
  necesario porque el Chat Trigger de n8n busca ese nombre de campo
  específicamente para mostrar el mensaje en el panel de chat.
- **Interpolar arrays/objetos en texto**: usar siempre
  `{{ JSON.stringify(valor) }}`, nunca `{{ valor }}` a secas — interpolar
  directo rompe el JSON de salida (arrays quedan sin corchetes/comillas).
- **"Always Output Data"**: mantenerlo activado en nodos Postgres que
  pueden devolver 0 filas (para no cortar el flujo), pero filtrar
  explícitamente esos resultados vacíos en el Code/lógica que sigue.
- **Manejo de errores de constraint** (double-booking): activar
  "Continue On Fail" en el nodo Postgres que puede violar el constraint, y
  usar un IF con `{{ $json.error }}` para bifurcar según si hubo conflicto.

## Pendientes de seguridad (resolver antes de producción con datos reales)

1. **Conexión Postgres sin verificación SSL** ("Ignore SSL Issues"
   activado) — el pooler de Supabase presentó un certificado autofirmado
   que Node no reconoce; se dejó sin verificar para destrabar el demo.
   Investigar solución prolija antes de manejar datos reales de pacientes.
2. **RLS**: revisar y activar políticas en `pacientes`, `turnos` y
   `conversaciones_activas` antes de exponer cualquier endpoint de lectura
   (ej. un futuro dashboard admin) — mismo criterio aplicado en
   `reservas-demo`.
3. **SQL con interpolación directa de variables** en las queries de
   Postgres (no se usan query parameters) — riesgo de inyección SQL si el
   mensaje de un paciente contiene comillas o caracteres especiales.
   Aceptable para demo, no para producción.

## Pendientes funcionales

- **Debounce de mensajes**: si el usuario manda varios mensajes seguidos
  (ej. "Hola" / "Que tal" / "quiero turno"), el flujo se dispara por cada
  uno por separado. Solución planeada: tabla buffer + nodo Wait (~6-8s) +
  reconciliación, descrita en la conversación pero no implementada.
- **Google Calendar**: crear evento al confirmar un turno — no
  implementado.
- **Email de confirmación al consultorio** para turnos normales (ya existe
  para la rama URGENTE, falta extenderlo a AGENDAR).
- **Workflow de recordatorio** (Cron, 1 día antes del turno) — no
  implementado.
- **Canal real de WhatsApp** (Meta Cloud API o Twilio) — hoy se prueba con
  Chat Trigger y `curl` contra el Webhook; falta la integración real.

## Infraestructura

No se contrató hosting pago para este demo — corre en n8n local
(`npx n8n`) más un túnel (ngrok) si se necesita exponerlo. Contratar
hosting recién cuando haya un cliente real pagando por el servicio (ver
`agencia-contexto.md`, sección de setup técnico, para la recomendación de
proveedor cuando llegue ese momento).