# Odonto Demo — Automatización de atención al cliente (WhatsApp + n8n)

> Última actualización: 27 de julio de 2026 (email de pacientes + recordatorio)
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
  y para confirmaciones de turnos normales (mismo proyecto de Google Cloud)
- **Calendario**: Google Calendar (mismo OAuth2 que Gmail, scope agregado),
  crea un evento por cada turno confirmado

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

-- Protección anti double-booking (requiere btree_gist en schema public)
create extension btree_gist with schema public;

alter table turnos add constraint turnos_no_solapamiento
exclude using gist (
  profesional_id with =,
  tstzrange(start_time, end_time) with &&
) where (status = 'confirmado');

-- Historial completo de conversación (para el futuro dashboard/CRM)
create table mensajes (
  id uuid primary key default gen_random_uuid(),
  telefono text not null,
  remitente text not null, -- 'paciente' | 'bot' | 'humano' (este último, sin usar aún)
  contenido text not null,
  created_at timestamptz default now()
);

alter table mensajes enable row level security;

-- Policy para la página /demo (dashboard): el chat embebido genera un
-- teléfono de demo por sesión de browser (prefijo fijo + sufijo random —
-- ver dashboard/src/lib/demoTelefono.ts). Sin esta policy, con RLS
-- activado y sin políticas, un select con la anon key devolvería vacío;
-- sin RLS, devolvería el historial completo de cualquier teléfono. Se
-- filtra por prefijo (en vez de por un teléfono exacto) para no abrir la
-- tabla entera a la anon key, permitiendo igual que cada sesión use un
-- teléfono distinto y no se pisen pacientes entre pruebas. Hoy el
-- dashboard lee `mensajes` server-side con la service role, no con la
-- anon key — esta policy queda lista para si en el futuro se agrega un
-- cliente Supabase de browser.
create policy "select_demo_conversation"
on mensajes for select
to anon
using (telefono like '+549demo%');
```

## Logging de conversación (sub-workflow "Log Mensaje")

Todo mensaje (entrante del paciente, o saliente del bot) se registra en la
tabla `mensajes` a través de un **workflow separado y reutilizable**
(`Log Mensaje`, n8n workflow id `PEr1zjn39MEv4B0i`), invocado desde el
workflow principal con nodos `Execute Workflow`. Evita mantener 10+ copias
del mismo insert de Postgres repetidas en cada rama.

- **Mensaje entrante**: se loguea una sola vez, justo después de `Input`,
  antes del dispatcher de estado — cubre todas las ramas sin repetir nada.
- **Mensajes salientes (respuesta del bot)**: se loguean en cada uno de
  los ~8 puntos de salida del flujo, justo antes del `Respond to Webhook`
  correspondiente. Patrón repetido en cada rama:
  ```
  [Set con el mensaje ya armado] → Execute Workflow (Log Mensaje)
    → [Set de restauración del campo `output`, pisado por el sub-workflow]
      → Respond to Webhook
  ```
- **Por qué existe el "Set de restauración"**: `Execute Workflow` reemplaza
  todo el item de datos por lo que devuelve el sub-workflow (`{success:
  true}`), borrando el campo `output` que se había armado antes. Hay que
  volver a escribirlo en un Set después, referenciando por nombre el nodo
  original que lo generó (`$('Set Output - X').first().json.output`).
- **Ramas que convergen antes de loguear** (ej. cancelación: "SI" y "NO"
  llegan al mismo punto): el Set de restauración necesita un ternario con
  `isExecuted` para no fallar leyendo un nodo que no corrió en esa
  ejecución:
  ```
  {{ $('NodoA').isExecuted ? $('NodoA').first().json.output : $('NodoB').first().json.output }}
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
    │     si OK: traer nombre del paciente → crear evento en Google Calendar
    │       → email de aviso al consultorio (Continue On Fail, no bloquea
    │       la confirmación al paciente) → ¿el paciente ya tiene email?
    │         ├─ SI → mandar confirmación por mail (Continue On Fail) →
    │         │        borrar conversaciones_activas → confirmar turno
    │         └─ NO → guardar estado "esperando_confirmacion_email" →
    │                  confirmar turno + preguntar si quiere recordatorio
    │                  por mail (sin bloquear el turno, ya está guardado)
    │
    ├─ "esperando_confirmacion_email"
    │   → interpretar SI/NO → si SI: guardar estado "esperando_email" →
    │     pedir el correo · si NO: borrar conversaciones_activas → listo
    │
    ├─ "esperando_email"
    │   → validar formato de email (si es inválido, repetir sin cambiar
    │     estado) → guardar email en `pacientes` → mandar confirmación por
    │     mail (Continue On Fail) → borrar conversaciones_activas → listo
    │
    └─ "confirmando_cancelacion"
        → interpretar SI/NO → si SI: cancelar turno (status='cancelado')
          → borrar conversaciones_activas → confirmar
```

## Recordatorio de turnos (email, 24hs antes)

Workflow separado (`n8n/recordatorio-turnos.json`, "Recordatorio de Turnos
(Email)") — a diferencia del recordatorio por WhatsApp (bloqueado hasta
tener el canal real conectado, ver `PENDIENTES.md`), este no depende de
ningún canal pendiente: usa la misma credencial de Gmail que ya funciona en
el flujo principal.

```
Schedule Trigger (diario, 09:00)
  → Postgres: turnos confirmados de mañana con paciente.email no nulo y
    recordatorio_enviado = false
    → Gmail: recordatorio al paciente (Continue On Fail)
      → Postgres: marcar recordatorio_enviado = true
```

La columna `turnos.recordatorio_enviado` evita mandar el mismo recordatorio
dos veces si el workflow se re-ejecuta manualmente el mismo día (algo
esperable durante pruebas). El workflow se importa con `"active": false` —
activarlo manualmente en n8n recién después de correr en Supabase el SQL de
`email`/`recordatorio_enviado` de la sección "Schema de base de datos".

## Convenciones aprendidas (importantes para no repetir errores ya resueltos)

- **Comparaciones de texto en Switch/IF**: usar siempre `contains`, nunca
  `equals` — la IA a veces agrega espacios o caracteres invisibles que
  rompen comparaciones exactas.
- **Referencias entre nodos**: `$json` solo refleja la salida del nodo
  **inmediatamente anterior**. Para traer datos de un nodo más atrás en la
  cadena, siempre usar `$('Nombre exacto del nodo').first().json...`.
  Siempre `.first()`, nunca `.item` — `.item` depende del "pairing" entre
  items, que un `Execute Workflow` de por medio (como `Log Mensaje`) puede
  romper. Bug real ya encontrado: el `INSERT` y el `SELECT` del dispatcher
  de estado (justo después de loguear el mensaje entrante) usaban `.item`
  mientras el resto del flujo usa `.first()` — al resolver el teléfono
  distinto entre unos y otros, el estado de la conversación quedaba
  huérfano (nunca avanzaba de `esperando_horario`, aunque el `UPDATE`
  corría sin error).
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
- **Pasos no críticos para el usuario** (ej. email de aviso al consultorio
  en un turno normal): activar "Continue On Fail" para que una falla ahí
  (Gmail caído, límite de cuota) nunca bloquee la confirmación al
  paciente, que ya quedó guardada en la base y en el Calendar antes de
  ese paso.
- **Nombres de campo con espacios invisibles rompen la notación de punto**:
  el bug más difícil de encontrar de todo el proyecto fue que el trigger
  del sub-workflow `Log Mensaje` tenía los campos nombrados con un espacio
  final (`"telefono "` en vez de `"telefono"`), invisible en la UI. La
  query interna los leía con `$json.telefono` (notación de punto, que
  busca el nombre exacto) y siempre daba `undefined`, en el 100% de los
  casos, de forma silenciosa (sin error visible). Se corrigió sacando el
  espacio del nombre del campo en el origen, en vez de parchear la lectura
  con notación de corchete (`$json['telefono ']`) — más prolijo a largo
  plazo, aunque haya requerido tocar más archivos.
- **Al reimportar un JSON completo a n8n**: usar siempre "Import from
  File" (reemplaza el canvas), nunca pegar el JSON directo (Ctrl+V), que
  duplica todos los nodos. Si hay dudas de que quedó algo residual,
  borrar todos los nodos manualmente antes de importar.
- **Rama PREGUNTA no soportaba más de un profesional**: la query traía
  `from profesionales limit 1` (siempre la primera fila, sin relación con
  quién preguntaba) y el prompt del modelo tenía el nombre "Dra. Pérez"
  hardcodeado en la regla de derivar consultas médicas, ignorando el dato
  real de la fila. Pasó desapercibido mientras solo existía un
  profesional; se notó al agregar uno nuevo desde el alta del dashboard.
  Se arregló agregando los profesionales en una sola fila con
  `string_agg`/`format` (sin fila arbitraria, sin ítems extra que rompan
  el nodo de IA que espera un solo item) y sacando el nombre hardcodeado
  del prompt.

## Dashboard / CRM

Dashboard de gestión en `dashboard/` (Next.js 16 + React 19 + Tailwind v4
+ Supabase) — parte del pitch de venta, no producto real para un cliente
todavía.

- **Lectura**: `/`, `/turnos`, `/pacientes`, `/pacientes/[id]`,
  `/profesionales`, `/profesionales/[id]`, `/conversaciones`,
  `/conversaciones/[telefono]` — 100% server-side vía `supabaseAdmin.ts`
  (guardia dura con paquete `server-only`: el build falla si un Client
  Component intenta importar la service role key). `/pacientes` y
  `/pacientes/[id]` muestran el `email` del paciente (solo lectura — se
  captura y edita únicamente desde la conversación de WhatsApp, no hay
  Server Action de pacientes).
- **Diseño**: sidebar izquierdo con íconos (`lucide-react`, única
  dependencia de UI del proyecto), ítem activo resaltado; home con stat
  cards + sección "Próximos turnos"; avatar de iniciales para
  profesionales (calculado desde `nombre`, sin columna nueva en la DB).
- **Escritura**: alta de profesionales inline vía Server Action
  (`profesionales/actions.ts`, primer Server Action del proyecto).
- **Chat de demo en vivo** (`/demo`): como todavía no hay WhatsApp real
  conectado (bloqueado por el proceso de aprobación de Meta, no
  controlable por la agencia), el chat de esta página le pega directo al
  **Webhook real** de n8n — el motor completo (IA, Supabase, Calendar) es
  el sistema real funcionando; lo único simulado es el canal visual de
  entrada. Cada sesión de browser genera un teléfono de demo random
  (prefijo `+549demo` + sufijo — ver `dashboard/src/lib/demoTelefono.ts`)
  para no pisar conversaciones entre pruebas simultáneas. Botón "Nueva
  conversación" (`api/demo/reset/route.ts`) borra `mensajes`,
  `conversaciones_activas` y `turnos` de ese teléfono vía `supabaseAdmin`,
  para no acumular datos entre demos.
  - Diseño visual del chat deliberadamente **no imita WhatsApp** (sin
    burbujas verdes) — para no dar a entender integración real con Meta
    en la reunión de venta.
  - El seguimiento de conversaciones lo cubre `/conversaciones` (lectura
    server-side); no hay panel con Supabase Realtime — se evaluó y se
    descartó.
- **Roadmap, no implementado**: intervención en vivo (un humano toma la
  conversación y el bot deja de responder) — requeriría un nuevo estado
  `atendido_por_humano` y un endpoint para "enviar como humano", que a su
  vez depende de la integración real de WhatsApp. Para el pitch de venta
  alcanza con un botón "Tomar la conversación" no funcional, presentado
  como roadmap.

Trabajo pendiente (funcional, seguridad) tracked en `PENDIENTES.md`.

## Infraestructura

No se contrató hosting pago para este demo — corre en n8n local
(`npx n8n`) más un túnel (ngrok) si se necesita exponerlo. Contratar
hosting recién cuando haya un cliente real pagando por el servicio (ver
`agencia-contexto.md`, sección de setup técnico, para la recomendación de
proveedor cuando llegue ese momento).