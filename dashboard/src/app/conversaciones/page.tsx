import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ConversacionesList, {
  type ConversacionRow,
} from "@/components/ConversacionesList";

export const dynamic = "force-dynamic";

const PREVIEW_LENGTH = 60;

export default async function ConversacionesPage() {
  const { data: mensajes } = await supabaseAdmin
    .from("mensajes")
    .select("telefono, contenido, created_at")
    .order("created_at", { ascending: false });

  // El primer registro por teléfono es el más reciente, porque ya viene ordenado desc.
  const ultimoPorTelefono = new Map<
    string,
    { contenido: string; created_at: string }
  >();
  for (const m of mensajes ?? []) {
    if (!ultimoPorTelefono.has(m.telefono)) {
      ultimoPorTelefono.set(m.telefono, m);
    }
  }

  const telefonos = [...ultimoPorTelefono.keys()];
  const { data: pacientes } = await supabaseAdmin
    .from("pacientes")
    .select("nombre, telefono")
    .in("telefono", telefonos.length > 0 ? telefonos : [""]);

  const nombrePorTelefono = new Map(
    (pacientes ?? []).map((p) => [p.telefono, p.nombre])
  );

  const conversaciones: ConversacionRow[] = telefonos.map((telefono) => {
    const ultimo = ultimoPorTelefono.get(telefono)!;
    return {
      telefono,
      nombre: nombrePorTelefono.get(telefono) ?? null,
      ultimo_mensaje:
        ultimo.contenido.length > PREVIEW_LENGTH
          ? `${ultimo.contenido.slice(0, PREVIEW_LENGTH)}…`
          : ultimo.contenido,
      ultimo_mensaje_at: ultimo.created_at,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Conversaciones</h1>
      <ConversacionesList conversaciones={conversaciones} />
    </div>
  );
}
