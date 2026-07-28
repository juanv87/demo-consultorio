const COLORS = ["bg-slate-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

function iniciales(nombre: string) {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0][0]?.toUpperCase() ?? "";
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

function colorFor(nombre: string) {
  const suma = [...nombre].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[suma % COLORS.length];
}

export default function Avatar({ nombre, size = "sm" }: { nombre: string; size?: "sm" | "lg" }) {
  const sizeClasses = size === "lg" ? "w-14 h-14 text-lg" : "w-8 h-8 text-xs";

  return (
    <div
      className={`${sizeClasses} ${colorFor(nombre)} rounded-full flex items-center justify-center text-white font-medium shrink-0`}
    >
      {iniciales(nombre)}
    </div>
  );
}
