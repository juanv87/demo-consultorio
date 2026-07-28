// ponytail: prefijo fijo + sufijo random, matcheado por la RLS policy de
// `mensajes` (`telefono like '+549demo%'`). Sube a un generador con más
// entropía si el prefijo empieza a colisionar entre sesiones simultáneas.
export function generarTelefono(): string {
  const sufijo = Math.floor(100000 + Math.random() * 900000);
  return `+549demo${sufijo}`;
}
