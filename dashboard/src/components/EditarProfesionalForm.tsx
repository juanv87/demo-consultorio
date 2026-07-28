"use client";

import { useState } from "react";
import { actualizarProfesional } from "@/app/profesionales/actions";
import ProfesionalForm from "@/components/ProfesionalForm";

type ProfesionalDefaults = {
  nombre: string;
  especialidad: string | null;
  duracion_consulta_minutes: number;
  hora_inicio: string;
  hora_fin: string;
  atiende_sabados: boolean;
  atiende_domingos: boolean;
};

export default function EditarProfesionalForm({
  id,
  defaults,
}: {
  id: string;
  defaults: ProfesionalDefaults;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-4 py-2"
      >
        Editar horario
      </button>
    );
  }

  return <ProfesionalForm action={actualizarProfesional.bind(null, id)} defaults={defaults} />;
}
