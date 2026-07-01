import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useCurrentUser } from "@/hooks/useAuth";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Materias } from "@/pages/Materias";
import { Ranking } from "@/pages/Ranking";
import { Tutor } from "@/pages/Tutor";
import { useThemeStore } from "@/store/theme";

export default function App() {
  const applyTheme = useThemeStore((s) => s.apply);
  useCurrentUser(); // hidrata el usuario si hay token

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tutor" element={<Tutor />} />
          <Route path="materias" element={<Materias />} />
          <Route path="ranking" element={<Ranking />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
