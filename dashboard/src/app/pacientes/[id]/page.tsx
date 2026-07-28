import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TurnosTable, { type Turno } from "@/components/TurnosTable";

export const dynamic = "force-dynamic";

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: paciente }, { data: turnos }] = await Promise.all([
    supabaseAdmin
      .from("pacientes")
      .select(`id, nombre, telefono, email, created_at`)
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
      .eq("paciente_id", id)
      .order("start_time", { ascending: false })
      .overrideTypes<Turno[]>(),
  ]);

  if (!paciente) {
    return <p className="text-slate-500">Paciente no encontrado.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{paciente.nombre}</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        {paciente.telefono}
        {paciente.email && ` · ${paciente.email}`}
      </p>
      <TurnosTable turnos={turnos ?? []} />
    </div>
  );
}
