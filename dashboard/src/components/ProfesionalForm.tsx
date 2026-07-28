"use client";

import { useActionState } from "react";

const inputClass = "border border-slate-300 rounded-lg px-3 py-2 text-sm";

type ProfesionalDefaults = {
  nombre: string;
  especialidad: string | null;
  duracion_consulta_minutes: number;
  hora_inicio: string;
  hora_fin: string;
  atiende_sabados: boolean;
  atiende_domingos: boolean;
};

type ActionState = { error: string | null };

export default function ProfesionalForm({
  action,
  defaults,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: ProfesionalDefaults;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="mb-6 border border-slate-200 rounded-lg bg-white p-4 flex flex-col gap-3">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="nombre" placeholder="Nombre" required defaultValue={defaults?.nombre} className={inputClass} />
        <input
          name="especialidad"
          placeholder="Especialidad"
          defaultValue={defaults?.especialidad ?? ""}
          className={inputClass}
        />
        <input
          name="duracion_consulta_minutes"
          type="number"
          placeholder="Duración (min)"
          defaultValue={defaults?.duracion_consulta_minutes ?? 30}
          className={inputClass}
        />
        <div className="flex gap-3">
          <input name="hora_inicio" type="time" defaultValue={defaults?.hora_inicio ?? "09:00"} className={inputClass} />
          <input name="hora_fin" type="time" defaultValue={defaults?.hora_fin ?? "18:00"} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-4 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="atiende_sabados" defaultChecked={defaults?.atiende_sabados} /> Sábados
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="atiende_domingos" defaultChecked={defaults?.atiende_domingos} /> Domingos
        </label>
      </div>
      <div>
        <button type="submit" className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">
          Guardar
        </button>
      </div>
    </form>
  );
}
