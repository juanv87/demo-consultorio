import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProfesionalesList from "@/components/ProfesionalesList";
import NuevoProfesionalForm from "@/components/NuevoProfesionalForm";

export const dynamic = "force-dynamic";

export default async function ProfesionalesPage() {
  const { data: profesionales } = await supabaseAdmin
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
    .order("nombre", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Profesionales</h1>
      <NuevoProfesionalForm />
      <ProfesionalesList profesionales={profesionales ?? []} />
    </div>
  );
}
