"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, MessageSquare, PlayCircle, Stethoscope, Users } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/turnos", label: "Turnos", icon: CalendarDays },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/profesionales", label: "Profesionales", icon: Stethoscope },
  { href: "/conversaciones", label: "Conversaciones", icon: MessageSquare },
  { href: "/demo", label: "Demo en vivo", icon: PlayCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen sticky top-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-6 py-4">
        <span className="font-semibold text-slate-900">Consultorio</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const isActive = link.href === "/" ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
