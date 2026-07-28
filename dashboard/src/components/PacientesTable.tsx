import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Paciente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  created_at: string;
  turnos: { count: number }[];
};

export default function PacientesTable({ pacientes }: { pacientes: Paciente[] }) {
  if (pacientes.length === 0) {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg py-8 text-center">
        No hay pacientes para mostrar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="py-2 px-4">Nombre</th>
            <th className="py-2 px-4">Teléfono</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Alta</th>
            <th className="py-2 px-4">Turnos totales</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((paciente) => (
            <tr key={paciente.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 whitespace-nowrap">
                <Link href={`/pacientes/${paciente.id}`} className="text-sky-700 underline">
                  {paciente.nombre}
                </Link>
              </td>
              <td className="py-2 px-4 whitespace-nowrap">{paciente.telefono}</td>
              <td className="py-2 px-4 whitespace-nowrap">{paciente.email ?? "—"}</td>
              <td className="py-2 px-4 whitespace-nowrap">
                {format(new Date(paciente.created_at), "d MMM yyyy", { locale: es })}
              </td>
              <td className="py-2 px-4">{paciente.turnos?.[0]?.count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
