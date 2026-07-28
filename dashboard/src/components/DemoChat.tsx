"use client";

import { useState } from "react";

type ChatMessage = {
  remitente: "paciente" | "bot";
  contenido: string;
};

export default function DemoChat({ telefono }: { telefono: string }) {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    const texto = input.trim();
    if (!texto || loading) return;

    setMensajes((prev) => [...prev, { remitente: "paciente", contenido: texto }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto, telefono }),
      });
      const data = await res.json();
      setMensajes((prev) => [...prev, { remitente: "bot", contenido: data.output }]);
    } catch {
      setError("No se pudo conectar con el bot. ¿Está corriendo n8n?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Chat</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`border-l-2 py-1 pl-3 text-sm ${
              m.remitente === "paciente" ? "border-slate-400" : "border-sky-400"
            }`}
          >
            <p className="mb-0.5 text-xs font-medium text-slate-500">
              {m.remitente === "paciente" ? "Paciente" : "Bot"}
            </p>
            <p className="whitespace-pre-wrap text-slate-800">{m.contenido}</p>
          </div>
        ))}
        {loading && (
          <div className="border-l-2 border-sky-400 py-1 pl-3 text-sm">
            <p className="mb-0.5 text-xs font-medium text-slate-500">Bot</p>
            <div className="flex gap-1 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
