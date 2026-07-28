"use client";

import { useState } from "react";
import ResetDemoButton from "@/components/ResetDemoButton";
import DemoChat from "@/components/DemoChat";
import { generarTelefono } from "@/lib/demoTelefono";

export default function DemoPage() {
  const [telefono, setTelefono] = useState(generarTelefono);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Demo en vivo</h1>
          <p className="text-xs text-slate-400">{telefono}</p>
        </div>
        <ResetDemoButton telefono={telefono} onReset={() => setTelefono(generarTelefono())} />
      </div>
      <DemoChat key={telefono} telefono={telefono} />
    </div>
  );
}
