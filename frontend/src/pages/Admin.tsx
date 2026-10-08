import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Coins,
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DailyBars } from "@/components/admin/DailyBars";
import {
  useAdminStats,
  useAdminUsers,
  useBulkSetActive,
  useSetRequireApproval,
  useSetUserActive,
} from "@/hooks/useAdmin";
import { apiError } from "@/lib/api";
import type { AdminStatusFilter, AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("es-PE");
const compact = new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" });

/** Panel de superadministrador: registros, consumo de IA y habilitar/desactivar cuentas. */
export function Admin() {
  const { data: stats, isLoading } = useAdminStats();
  const approval = useSetRequireApproval();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <ShieldCheck className="text-brand-600 dark:text-brand-300" size={28} /> Superadmin
          </h1>
          <p className="text-base text-muted">Registros, consumo de IA y acceso de los usuarios.</p>
        </div>
        {stats && (
          <Switch
            checked={stats.require_approval}
            disabled={approval.isPending}
            onChange={(v) => approval.mutate(v)}
            label="Aprobar registros nuevos"
            hint={stats.require_approval ? "Las cuentas nuevas nacen desactivadas" : "Las cuentas nuevas entran directo"}
          />
        )}
      </div>

      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile icon={Users} label="Registrados" value={fmt.format(stats.users_total)}
              detail={`${fmt.format(stats.registered_7d)} en los últimos 7 días`} />
            <StatTile icon={UserPlus} label="Nuevos hoy" value={fmt.format(stats.registered_today)}
              detail="Día de Lima" />
            <StatTile icon={UserCheck} label="Habilitados" value={fmt.format(stats.users_active)}
              detail={`${fmt.format(stats.users_inactive)} desactivados`} />
            <StatTile icon={Coins} label="Tokens de IA" value={compact.format(stats.tokens_input + stats.tokens_output)}
              detail={`${compact.format(stats.tokens_today)} hoy · ${fmt.format(stats.ai_calls)} llamadas`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="text-lg font-black">Registros por día</h2>
              <p className="mb-3 text-sm text-muted">Últimos 30 días · {fmt.format(stats.registered_7d)} esta semana</p>
              <DailyBars data={stats.series} metric="registrations" label="Registros"
                colorClass="fill-[#7c3aed] dark:fill-[#8b5cf6]" />
            </section>
            <section className="card p-5">
              <h2 className="text-lg font-black">Tokens consumidos por día</h2>
              <p className="mb-3 text-sm text-muted">
                Entrada {compact.format(stats.tokens_input)} · Salida {compact.format(stats.tokens_output)}
              </p>
              <DailyBars data={stats.series} metric="tokens" label="Tokens" colorClass="fill-[#0d9488]" />
            </section>
          </div>

          {stats.top_users.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
                <Activity size={20} /> Quiénes más consumen
              </h2>
              <ol className="space-y-2">
                {stats.top_users.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-right font-black text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-bold">{u.full_name}</span>{" "}
                      <span className="text-muted">{u.email}</span>
                    </span>
                    <span className="font-black tabular-nums">{fmt.format(u.tokens)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <UsersManager />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
        <Icon size={14} /> {label}
      </p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-muted">{detail}</p>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-[rgb(var(--border))]",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
  if (!label || !hint) return button;
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <div className="text-right">
        <p className="text-sm font-black">{label}</p>
        <p className="text-xs font-semibold text-muted">{hint}</p>
      </div>
      {button}
    </div>
  );
}

const STATUS_TABS: { value: AdminStatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Habilitados" },
  { value: "inactive", label: "Desactivados" },
];

function UsersManager() {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  // Búsqueda con pausa corta: no consulta en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useAdminUsers({ q, status, page });
  const setActive = useSetUserActive();
  const bulk = useBulkSetActive();
  const items = data?.items ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const selectable = items.filter((u) => u.role !== "superadmin");
  const allSelected = selectable.length > 0 && selectable.every((u) => selected.has(u.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((u) => u.id)));
  }

  async function runBulk(is_active: boolean, everyone: boolean) {
    setNotice(null);
    try {
      const res = await bulk.mutateAsync({ is_active, user_ids: everyone ? undefined : [...selected] });
      setSelected(new Set());
      setNotice(`${fmt.format(res.updated)} cuenta(s) ${is_active ? "habilitada(s)" : "desactivada(s)"}.`);
    } catch (err) {
      setNotice(apiError(err));
    }
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black">Usuarios {data && <span className="text-muted">({fmt.format(data.total)})</span>}</h2>
        <div className="flex flex-wrap gap-2">
          <ConfirmButton
            className="btn-ghost !text-emerald-700 dark:!text-emerald-300"
            busy={bulk.isPending}
            onConfirm={() => runBulk(true, true)}
            idle={<><UserCheck size={16} /> Habilitar a todos</>}
          />
          <ConfirmButton
            className="btn-ghost !text-red-600 dark:!text-red-400"
            busy={bulk.isPending}
            onConfirm={() => runBulk(false, true)}
            idle={<><UserX size={16} /> Desactivar a todos</>}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className="input !pl-10"
            aria-label="Buscar usuarios"
          />
        </label>
        <div className="flex gap-1.5" role="group" aria-label="Estado">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              aria-pressed={status === t.value}
              className={cn(
                "chip",
                status === t.value && "!border-brand-500 !bg-brand-500/10 !text-brand-700 dark:!text-brand-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-500/10 px-3 py-2 text-sm font-bold">
          {fmt.format(selected.size)} seleccionado(s)
          <button className="btn-ghost !min-h-[36px] !text-emerald-700 dark:!text-emerald-300"
            disabled={bulk.isPending} onClick={() => runBulk(true, false)}>
            <UserCheck size={16} /> Habilitar
          </button>
          <button className="btn-ghost !min-h-[36px] !text-red-600 dark:!text-red-400"
            disabled={bulk.isPending} onClick={() => runBulk(false, false)}>
            <UserX size={16} /> Desactivar
          </button>
          <button className="btn-ghost !min-h-[36px]" onClick={() => setSelected(new Set())}>Quitar selección</button>
        </div>
      )}
      {notice && <p className="mb-3 text-sm font-semibold text-muted">{notice}</p>}

      <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs font-extrabold uppercase tracking-wide text-muted">
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="w-8 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  aria-label="Seleccionar todos los de esta página" className="h-4 w-4 accent-brand-600" />
              </th>
              <th className="py-2">Usuario</th>
              <th className="py-2">Registro</th>
              <th className="py-2 text-right">Retos</th>
              <th className="py-2 pr-4 text-right">Tokens</th>
              <th className="py-2">Última actividad</th>
              <th className="py-2 text-right">Acceso</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <UserRow key={u.id} user={u} selected={selected.has(u.id)} onSelect={() => toggleOne(u.id)}
                onToggle={(v) => setActive.mutate({ id: u.id, is_active: v })}
                busy={setActive.isPending && setActive.variables?.id === u.id} />
            ))}
            {data && items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">No hay usuarios con ese filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm font-bold">
          <button className="btn-ghost !min-h-[36px]" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            aria-label="Página anterior">
            <ChevronLeft size={18} />
          </button>
          Página {page} de {pages}
          <button className="btn-ghost !min-h-[36px]" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
            aria-label="Página siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
  onToggle,
  busy,
}: {
  user: AdminUser;
  selected: boolean;
  onSelect: () => void;
  onToggle: (v: boolean) => void;
  busy: boolean;
}) {
  const isSuper = user.role === "superadmin";
  return (
    <tr className={cn("border-b border-[rgb(var(--border))] last:border-0", !user.is_active && "text-muted")}>
      <td className="py-2.5">
        {!isSuper && (
          <input type="checkbox" checked={selected} onChange={onSelect}
            aria-label={`Seleccionar a ${user.full_name}`} className="h-4 w-4 accent-brand-600" />
        )}
      </td>
      <td className="max-w-[240px] py-2.5">
        <p className="truncate font-bold">
          {user.full_name}
          {isSuper && (
            <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-brand-700 dark:text-brand-300">
              Superadmin
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </td>
      <td className="whitespace-nowrap py-2.5">{dateFmt.format(new Date(user.created_at))}</td>
      <td className="py-2.5 text-right tabular-nums">{fmt.format(user.conversations)}</td>
      <td className="py-2.5 pr-4 text-right font-bold tabular-nums">{fmt.format(user.tokens)}</td>
      <td className="whitespace-nowrap py-2.5 text-xs">
        {user.last_activity ? dateTimeFmt.format(new Date(user.last_activity)) : "—"}
      </td>
      <td className="py-2.5">
        <div className="flex items-center justify-end gap-2">
          <span className="hidden text-xs font-bold sm:inline">{user.is_active ? "Habilitado" : "Desactivado"}</span>
          {busy ? (
            <Loader2 size={18} className="animate-spin text-muted" />
          ) : (
            <Switch checked={user.is_active} disabled={isSuper} onChange={onToggle} />
          )}
        </div>
      </td>
    </tr>
  );
}

/** Acción masiva en dos toques (sin diálogos del navegador): el 2.º toque confirma. */
function ConfirmButton({
  idle,
  onConfirm,
  busy,
  className,
}: {
  idle: React.ReactNode;
  onConfirm: () => void;
  busy: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 6000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={cn(className, "!min-h-[40px]", armed && "ring-2 ring-current")}
      disabled={busy}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : armed ? "¿Seguro? Toca otra vez" : idle}
    </button>
  );
}
