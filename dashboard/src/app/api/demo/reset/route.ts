import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const { telefono } = await request.json();
  if (!telefono || !telefono.startsWith("+549demo")) {
    return NextResponse.json({ error: "telefono inválido" }, { status: 400 });
  }

  await supabaseAdmin.from("mensajes").delete().eq("telefono", telefono);
  // Borra también el estado de conversación activa: si no, el bot sigue
  // "a mitad de flujo" (ej. esperando_nombre) en el primer mensaje de la
  // próxima demo.
  await supabaseAdmin.from("conversaciones_activas").delete().eq("telefono", telefono);

  // Borra también los turnos agendados en pruebas anteriores: si no,
  // se acumulan turnos "confirmado" del paciente demo entre una demo y la
  // siguiente.
  const { data: paciente } = await supabaseAdmin
    .from("pacientes")
    .select("id")
    .eq("telefono", telefono)
    .maybeSingle();

  if (paciente) {
    await supabaseAdmin.from("turnos").delete().eq("paciente_id", paciente.id);
  }

  return NextResponse.json({ success: true });
}
