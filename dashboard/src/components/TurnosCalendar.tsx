"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Turno } from "@/components/TurnosTable";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
});

const mensajes = {
  next: "Sig.",
  previous: "Ant.",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Turno",
  noEventsInRange: "No hay turnos en este rango.",
};

export default function TurnosCalendar({ turnos }: { turnos: Turno[] }) {
  // ponytail: react-big-calendar's internal state (via `uncontrollable`) doesn't
  // survive React 18/19 Strict Mode's double-render in dev, so toolbar buttons
  // silently no-op unless date/view are controlled explicitly.
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const events = turnos
    .filter((turno) => turno.status === "confirmado")
    .map((turno) => ({
      title: [turno.pacientes?.nombre, turno.profesionales?.nombre].filter(Boolean).join(" · ") || "—",
      start: new Date(turno.start_time),
      end: new Date(turno.end_time),
    }));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4" style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="es"
        messages={mensajes}
        date={date}
        onNavigate={setDate}
        view={view}
        onView={setView}
      />
    </div>
  );
}
