import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard — Consultorio",
  description: "Panel de solo lectura de turnos, pacientes y profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1">
            <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
