import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PacientesTable from "@/components/PacientesTable";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const { data: pacientes } = await supabaseAdmin
    .from("pacientes")
    .select(
      `
      id,
      nombre,
      telefono,
      email,
      created_at,
      turnos ( count )
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Pacientes</h1>
      <PacientesTable pacientes={pacientes ?? []} />
    </div>
  );
}
