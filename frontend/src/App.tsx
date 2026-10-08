import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { useCurrentUser } from "@/hooks/useAuth";
import { Admin } from "@/pages/Admin";
import { Dashboard } from "@/pages/Dashboard";
import { Explorar } from "@/pages/Explorar";
import { Login } from "@/pages/Login";
import { Logros } from "@/pages/Logros";
import { Tutor } from "@/pages/Tutor";
import { useThemeStore } from "@/store/theme";

export default function App() {
  const applyTheme = useThemeStore((s) => s.apply);
  useCurrentUser(); // hidrata el usuario si hay token

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    // Respeta "reducir movimiento" del sistema (niños sensibles a animaciones).
    // LazyMotion + `m`: carga solo las features de animación que se usan (~30 kb menos).
    // `strict` avisa si algún componente vuelve a importar `motion` completo.
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tutor" element={<Tutor />} />
            <Route path="explorar" element={<Explorar />} />
            <Route path="logros" element={<Logros />} />
            <Route element={<SuperAdminRoute />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="materias" element={<Navigate to="/explorar" replace />} />
            <Route path="ranking" element={<Navigate to="/logros" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MotionConfig>
    </LazyMotion>
  );
}
