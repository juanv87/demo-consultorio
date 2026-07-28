"use client";

import { useState } from "react";
import { crearProfesional } from "@/app/profesionales/actions";
import ProfesionalForm from "@/components/ProfesionalForm";

export default function NuevoProfesionalForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-4 py-2"
      >
        + Agregar profesional
      </button>
    );
  }

  return <ProfesionalForm action={crearProfesional} />;
}
