"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import TurnosTable, { type Turno } from "@/components/TurnosTable";

const TurnosCalendar = dynamic(() => import("@/components/TurnosCalendar"), {
  ssr: false,
});

export default function TurnosView({ turnos }: { turnos: Turno[] }) {
  const [vista, setVista] = useState<"tabla" | "calendario">("tabla");

  const tabClass = (activa: boolean) =>
    `text-sm px-3 py-1.5 rounded-lg border ${
      activa ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
    }`;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setVista("tabla")} className={tabClass(vista === "tabla")}>
          Tabla
        </button>
        <button onClick={() => setVista("calendario")} className={tabClass(vista === "calendario")}>
          Calendario
        </button>
      </div>
      {vista === "tabla" ? <TurnosTable turnos={turnos} /> : <TurnosCalendar turnos={turnos} />}
    </div>
  );
}
