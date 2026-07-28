import Link from "next/link";
import Avatar from "@/components/Avatar";

type Profesional = {
  id: string;
  nombre: string;
  especialidad: string | null;
  duracion_consulta_minutes: number;
  hora_inicio: string;
  hora_fin: string;
  atiende_sabados: boolean;
  atiende_domingos: boolean;
};

export default function ProfesionalesList({
  profesionales,
}: {
  profesionales: Profesional[];
}) {
  return (
    <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
      {profesionales.map((profesional) => (
        <li key={profesional.id} className="p-4">
          <Link href={`/profesionales/${profesional.id}`} className="flex items-center gap-3">
            <Avatar nombre={profesional.nombre} />
            <div>
              <p className="font-medium text-slate-900 hover:underline">
                {profesional.nombre}
              </p>
              {profesional.especialidad && (
                <p className="text-sm text-slate-500">{profesional.especialidad}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                Atiende {profesional.hora_inicio}–{profesional.hora_fin} · consultas de{" "}
                {profesional.duracion_consulta_minutes} min
                {profesional.atiende_sabados ? " · sábados" : ""}
                {profesional.atiende_domingos ? " · domingos" : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
