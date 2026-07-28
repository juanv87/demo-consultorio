"use client";

import { useState } from "react";

export default function ResetDemoButton({
  telefono,
  onReset,
}: {
  telefono: string;
  onReset: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    await fetch("/api/demo/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono }),
    });
    onReset();
    setLoading(false);
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? "Reiniciando..." : "Nueva conversación"}
    </button>
  );
}
