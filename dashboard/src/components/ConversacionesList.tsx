import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type ConversacionRow = {
  telefono: string;
  nombre: string | null;
  ultimo_mensaje: string;
  ultimo_mensaje_at: string;
};

export default function ConversacionesList({
  conversaciones,
}: {
  conversaciones: ConversacionRow[];
}) {
  if (conversaciones.length === 0) {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg py-8 text-center">
        No hay conversaciones para mostrar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="py-2 px-4">Paciente</th>
            <th className="py-2 px-4">Último mensaje</th>
            <th className="py-2 px-4">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {conversaciones.map((c) => (
            <tr key={c.telefono} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 whitespace-nowrap">
                <Link
                  href={`/conversaciones/${encodeURIComponent(c.telefono)}`}
                  className="text-sky-700 underline"
                >
                  {c.nombre ?? c.telefono}
                </Link>
              </td>
              <td className="py-2 px-4 text-slate-600">{c.ultimo_mensaje}</td>
              <td className="py-2 px-4 whitespace-nowrap">
                {format(new Date(c.ultimo_mensaje_at), "d MMM yyyy - HH:mm", { locale: es })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
