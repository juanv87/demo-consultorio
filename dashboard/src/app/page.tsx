import { endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { CalendarDays, Stethoscope, Users } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import StatCard from "@/components/StatCard";
import TurnosTable, { type Turno } from "@/components/TurnosTable";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    { count: turnosConfirmados },
    { count: turnosEstaSemana },
    { count: totalPacientes },
    { count: totalProfesionales },
    { count: turnosHoy },
    { data: proximosTurnos },
  ] = await Promise.all([
    supabaseAdmin
      .from("turnos")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmado"),
    supabaseAdmin
      .from("turnos")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmado")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabaseAdmin.from("pacientes").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profesionales").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("turnos")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmado")
      .gte("start_time", todayStart.toISOString())
      .lt("start_time", todayEnd.toISOString()),
    supabaseAdmin
      .from("turnos")
      .select(
        `
        id,
        start_time,
        end_time,
        status,
        pacientes ( nombre, telefono ),
        profesionales ( nombre )
      `
      )
      .gte("start_time", now.toISOString())
      .eq("status", "confirmado")
      .order("start_time", { ascending: true })
      .limit(5)
      .overrideTypes<Turno[]>(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Resumen</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Turnos confirmados (total)" value={turnosConfirmados ?? 0} icon={CalendarDays} />
        <StatCard label="Turnos confirmados esta semana" value={turnosEstaSemana ?? 0} icon={CalendarDays} />
        <StatCard label="Turnos hoy" value={turnosHoy ?? 0} icon={CalendarDays} />
        <StatCard label="Pacientes" value={totalPacientes ?? 0} icon={Users} />
        <StatCard label="Profesionales" value={totalProfesionales ?? 0} icon={Stethoscope} />
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mt-10 mb-4">Próximos turnos</h2>
      <TurnosTable turnos={proximosTurnos ?? []} />
    </div>
  );
}
