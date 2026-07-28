import { format } from "date-fns";
import { es } from "date-fns/locale";

export type Turno = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  pacientes: { nombre: string; telefono: string } | null;
  profesionales: { nombre: string } | null;
};

function EstadoBadge({ status }: { status: string }) {
  const isConfirmado = status === "confirmado";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        isConfirmado ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function TurnosTable({ turnos }: { turnos: Turno[] }) {
  if (turnos.length === 0) {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg py-8 text-center">
        No hay turnos para mostrar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="py-2 px-4">Fecha y hora</th>
            <th className="py-2 px-4">Paciente</th>
            <th className="py-2 px-4">Teléfono</th>
            <th className="py-2 px-4">Profesional</th>
            <th className="py-2 px-4">Estado</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map((turno) => (
            <tr key={turno.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 whitespace-nowrap">
                {format(new Date(turno.start_time), "EEE d MMM - HH:mm", { locale: es })}
              </td>
              <td className="py-2 px-4 whitespace-nowrap">{turno.pacientes?.nombre ?? "—"}</td>
              <td className="py-2 px-4 whitespace-nowrap">{turno.pacientes?.telefono ?? "—"}</td>
              <td className="py-2 px-4 whitespace-nowrap">{turno.profesionales?.nombre ?? "—"}</td>
              <td className="py-2 px-4">
                <EstadoBadge status={turno.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
