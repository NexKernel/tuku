import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Trophy,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tutor", label: "Tutor IA", icon: MessageSquareText },
  { to: "/materias", label: "Materias", icon: BookOpen },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[rgb(var(--border))] p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
            <GraduationCap size={20} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">PREU Mentor</p>
            <p className="text-[11px] text-muted">IA · Preuniversitario</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-600 text-white shadow-soft"
                    : "text-muted hover:bg-brand-500/10 hover:text-brand-500",
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.full_name ?? "Estudiante"}</p>
            <p className="truncate text-[11px] text-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn-ghost"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-3">
          <div className="md:hidden flex items-center gap-2 font-bold">
            <GraduationCap size={20} className="text-brand-500" /> PREU Mentor
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
