export function MensajeBubble({
  remitente,
  contenido,
}: {
  remitente: string;
  contenido: string;
}) {
  return (
    <div
      className={`border-l-2 py-1 pl-3 text-sm ${
        remitente === "paciente" ? "border-slate-400" : "border-sky-400"
      }`}
    >
      <p className="mb-0.5 text-xs font-medium text-slate-500">
        {remitente === "paciente" ? "Paciente" : remitente === "bot" ? "Bot" : "Humano"}
      </p>
      <p className="whitespace-pre-wrap text-slate-800">{contenido}</p>
    </div>
  );
}
