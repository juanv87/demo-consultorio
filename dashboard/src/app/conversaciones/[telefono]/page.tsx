import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MensajeBubble } from "@/components/MensajeBubble";

export const dynamic = "force-dynamic";

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ telefono: string }>;
}) {
  const { telefono: rawTelefono } = await params;
  const telefono = decodeURIComponent(rawTelefono);

  const { data: mensajes } = await supabaseAdmin
    .from("mensajes")
    .select("id, remitente, contenido, created_at")
    .eq("telefono", telefono)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">{telefono}</h1>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        {(mensajes ?? []).map((m) => (
          <MensajeBubble key={m.id} remitente={m.remitente} contenido={m.contenido} />
        ))}
        {(mensajes ?? []).length === 0 && (
          <p className="text-sm text-slate-400">Sin mensajes todavía.</p>
        )}
      </div>
    </div>
  );
}
