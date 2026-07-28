"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function crearProfesional(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const nombre = formData.get("nombre")?.toString().trim();

  if (!nombre) {
    return { error: "El nombre es obligatorio" };
  }

  const especialidad = formData.get("especialidad")?.toString().trim() || null;
  const duracion_consulta_minutes = Number(formData.get("duracion_consulta_minutes")) || 30;
  const hora_inicio = formData.get("hora_inicio")?.toString() || "09:00";
  const hora_fin = formData.get("hora_fin")?.toString() || "18:00";
  const atiende_sabados = formData.get("atiende_sabados") === "on";
  const atiende_domingos = formData.get("atiende_domingos") === "on";

  const { error } = await supabaseAdmin.from("profesionales").insert({
    nombre,
    especialidad,
    duracion_consulta_minutes,
    hora_inicio,
    hora_fin,
    atiende_sabados,
    atiende_domingos,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profesionales");
  return { error: null };
}

export async function actualizarProfesional(
  id: string,
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const nombre = formData.get("nombre")?.toString().trim();

  if (!nombre) {
    return { error: "El nombre es obligatorio" };
  }

  const especialidad = formData.get("especialidad")?.toString().trim() || null;
  const duracion_consulta_minutes = Number(formData.get("duracion_consulta_minutes")) || 30;
  const hora_inicio = formData.get("hora_inicio")?.toString() || "09:00";
  const hora_fin = formData.get("hora_fin")?.toString() || "18:00";
  const atiende_sabados = formData.get("atiende_sabados") === "on";
  const atiende_domingos = formData.get("atiende_domingos") === "on";

  const { error } = await supabaseAdmin
    .from("profesionales")
    .update({
      nombre,
      especialidad,
      duracion_consulta_minutes,
      hora_inicio,
      hora_fin,
      atiende_sabados,
      atiende_domingos,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profesionales");
  revalidatePath(`/profesionales/${id}`);
  return { error: null };
}
