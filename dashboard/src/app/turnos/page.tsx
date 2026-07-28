import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { type Turno } from "@/components/TurnosTable";
import TurnosView from "@/components/TurnosView";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const { data: turnos } = await supabaseAdmin
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
    .order("start_time", { ascending: false })
    // Sin tipos generados desde el schema, supabase-js no puede saber que
    // paciente_id/profesional_id son relaciones "uno" y tipa el embed como
    // array por default. En runtime PostgREST sí devuelve un objeto único.
    .overrideTypes<Turno[]>();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Turnos</h1>
      <TurnosView turnos={turnos ?? []} />
    </div>
  );
}
