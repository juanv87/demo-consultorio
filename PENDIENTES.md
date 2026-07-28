# Pendientes — Demo Odonto

> Reemplaza a `PLAN-demo-page.md` y `Plan_Rediseño.md` (ambos implementados;
> lo construido pasó a `CLAUDE.md` como característica, lo descartado —panel
> en vivo con Supabase Realtime— se sacó del todo). Este documento trackea
> únicamente trabajo pendiente; diseño y arquitectura ya construidos viven
> en `CLAUDE.md`.

## Funcionalidad (workflow n8n + dashboard)

- **Canal real de WhatsApp** (Meta Cloud API o Twilio) — hoy se prueba con
  Chat Trigger, `curl`, o el chat de `/demo` contra el Webhook. Bloqueante
  real para conectar un WhatsApp de verdad y para el recordatorio (abajo).
- **Workflow de recordatorio por WhatsApp** (Cron, 1 día antes del turno) —
  diseño ya definido (Cron diario → query de turnos de "mañana" → mensaje
  por paciente), no implementado: es un flujo proactivo, no se puede probar
  sin el canal real de WhatsApp conectado. Retomar cuando eso esté resuelto.
  (El recordatorio por email sí está implementado — no depende de WhatsApp,
  ver `n8n/recordatorio-turnos.json` y `CLAUDE.md`.)
- **Debounce de mensajes**: si el usuario manda varios mensajes seguidos
  (ej. "Hola" / "Que tal" / "quiero turno"), el flujo se dispara por cada
  uno por separado. Solución planeada: tabla buffer + nodo Wait (~6-8s) +
  reconciliación. No bloqueante para el demo actual (chat/curl de a un
  mensaje por vez).
- **`dashboard/.env.example`**: no existe ningún archivo de ejemplo de env
  vars en `dashboard/`. Crear uno con las variables ya en uso:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_N8N_WEBHOOK_URL`.

- **Bloqueo de fechas puntuales por profesional** (feriados, vacaciones,
  día no laborable) — hoy `profesionales` solo modela disponibilidad
  semanal recurrente (`hora_inicio`/`hora_fin`/`atiende_sabados`/
  `atiende_domingos`); no hay forma de excluir una fecha puntual. Requiere
  tabla nueva (ej. `bloqueos_disponibilidad`: `profesional_id`, `fecha`,
  motivo opcional) y que el workflow n8n la consulte al calcular horarios
  libres en la rama AGENDAR — no alcanza con un cambio solo en el
  dashboard. Alcance descartado a propósito al implementar la edición de
  horario semanal (`ProfesionalForm.tsx`) y el calendario visual, para no
  mezclar cambio de schema con esa entrega.

## Seguridad (resolver antes de producción con datos reales)

1. **Conexión Postgres sin verificación SSL** ("Ignore SSL Issues"
   activado en n8n) — el pooler de Supabase presentó un certificado
   autofirmado que Node no reconoce; se dejó sin verificar para destrabar
   el demo. Investigar solución prolija antes de manejar datos reales de
   pacientes.
2. **RLS**: revisar y activar políticas en `pacientes`, `turnos` y
   `conversaciones_activas` antes de exponer cualquier endpoint de lectura
   con la anon key (hoy solo `mensajes` tiene policy, para el chat de
   `/demo`).
3. **SQL con interpolación directa de variables** en las queries de
   Postgres del workflow n8n (no se usan query parameters) — riesgo de
   inyección SQL si el mensaje de un paciente contiene comillas o
   caracteres especiales. Aceptable para demo, no para producción.
4. **`react-big-calendar` (dependencia del calendario visual en
   `dashboard/`)**: `npm install` reportó 12 vulnerabilidades "high",
   probablemente en dependencias transitivas del paquete (sin mantenimiento
   activo reciente). No evaluadas todavía — correr `npm audit` y decidir si
   conviene fijar versiones, buscar alternativa, o aceptar el riesgo antes
   de manejar datos reales de pacientes.
