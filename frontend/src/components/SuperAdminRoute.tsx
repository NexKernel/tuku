import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";

/** Solo superadmin. El backend también lo exige: esto solo evita mostrar una pantalla vacía. */
export function SuperAdminRoute() {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return user?.role === "superadmin" ? <Outlet /> : <Navigate to="/" replace />;
}
