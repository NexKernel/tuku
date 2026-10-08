import { m } from "framer-motion";
import { Award, Compass, House, LogOut, MessageCircleQuestion } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TukuOwl } from "@/components/TukuOwl";
import { useReviews } from "@/hooks/useTutor";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio", icon: House, end: true },
  { to: "/tutor", label: "Pensar", icon: MessageCircleQuestion },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/logros", label: "Mis logros", icon: Award },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  // Aviso discreto en "Inicio" cuando hay repasos pendientes.
  const { data: reviews } = useReviews();
  const reviewsDue = (reviews?.due.length ?? 0) > 0;

  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-full">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[rgb(var(--border))] p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <TukuOwl size={44} still />
          <div className="leading-tight">
            <p className="text-xl font-black tracking-tight">Tuku</p>
            <p className="text-xs font-semibold text-muted">Aprende a pensar</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-base font-bold transition",
                  isActive
                    ? "bg-brand-600 text-white shadow-pop"
                    : "text-muted hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300",
                )
              }
            >
              <Icon size={22} strokeWidth={2.4} />
              {label}
              {to === "/" && reviewsDue && <ReviewDot />}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/25 text-base font-black text-amber-700 dark:text-amber-300">
              {(user?.full_name ?? "E").charAt(0).toUpperCase()}
            </span>
            <p className="truncate text-sm font-bold">{user?.full_name ?? "Estudiante"}</p>
          </div>
          <button onClick={signOut} className="btn-ghost" title="Salir" aria-label="Salir">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <TukuOwl size={34} still />
            <span className="text-lg font-black">Tuku</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <button onClick={signOut} className="btn-ghost md:hidden" aria-label="Salir" title="Salir">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <m.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6"
        >
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer className="mt-6" />
        </m.main>
      </div>

      {/* Barra inferior (tablet y celular): lo más usado en las aulas */}
      <nav
        aria-label="Principal"
        className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold transition",
                isActive ? "text-brand-600 dark:text-brand-300" : "text-muted",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "relative flex h-8 w-12 items-center justify-center rounded-full transition",
                    isActive && "bg-brand-500/15",
                  )}
                >
                  <Icon size={22} strokeWidth={2.4} />
                  {to === "/" && reviewsDue && <ReviewDot />}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function ReviewDot() {
  return (
    <span
      className="ml-auto h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[rgb(var(--surface))] max-md:absolute max-md:right-2 max-md:top-0.5 max-md:ml-0"
      aria-label="Tienes repasos pendientes"
      title="Tienes repasos pendientes"
    />
  );
}
