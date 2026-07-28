import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { type Turno } from "@/components/TurnosTable";
import TurnosView from "@/components/TurnosView";
import Avatar from "@/components/Avatar";
import EditarProfesionalForm from "@/components/EditarProfesionalForm";

export const dynamic = "force-dynamic";

export default async function ProfesionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: profesional }, { data: turnos }] = await Promise.all([
    supabaseAdmin
      .from("profesionales")
      .select(
        `
      id,
      nombre,
      especialidad,
      duracion_consulta_minutes,
      hora_inicio,
      hora_fin,
      atiende_sabados,
      atiende_domingos
    `
      )
      .eq("id", id)
      .single(),
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
      .eq("profesional_id", id)
      .order("start_time", { ascending: false })
      .overrideTypes<Turno[]>(),
  ]);

  if (!profesional) {
    return <p className="text-slate-500">Profesional no encontrado.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar nombre={profesional.nombre} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{profesional.nombre}</h1>
          {profesional.especialidad && (
            <p className="text-slate-500">{profesional.especialidad}</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-4 mb-4">
        Atiende {profesional.hora_inicio}–{profesional.hora_fin} · consultas de{" "}
        {profesional.duracion_consulta_minutes} min
        {profesional.atiende_sabados ? " · sábados" : ""}
        {profesional.atiende_domingos ? " · domingos" : ""}
      </p>
      <EditarProfesionalForm id={profesional.id} defaults={profesional} />
      <TurnosView turnos={turnos ?? []} />
    </div>
  );
}
