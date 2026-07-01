import { motion } from "framer-motion";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { apiError } from "@/lib/api";

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("estudiante@preu.pe");
  const [password, setPassword] = useState("estudiante123");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const register = useRegister();
  const navigate = useNavigate();
  const loading = login.isPending || register.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "register") {
        await register.mutateAsync({ email, password, full_name: fullName });
      }
      await login.mutateAsync({ email, password });
      navigate("/");
    } catch (err) {
      setError(apiError(err, "No se pudo iniciar sesión."));
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 font-bold">
          <GraduationCap /> PREU Mentor IA
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            No te damos la respuesta.
            <br />
            Te enseñamos a encontrarla.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Un tutor Socrático que desarrolla tu razonamiento, mejora tu velocidad mental y te
            prepara para el examen de admisión.
          </p>
        </div>
        <p className="text-sm text-brand-200">Flujo pedagógico de 15 pasos · IA adaptativa</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-8">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card w-full max-w-sm space-y-4 p-8"
        >
          <div className="lg:hidden flex items-center gap-2 font-bold text-brand-500">
            <GraduationCap /> PREU Mentor IA
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h2>
            <p className="text-sm text-muted">
              {mode === "login"
                ? "Ingresa para continuar tu preparación."
                : "Empieza a entrenar con tu mentor IA."}
            </p>
          </div>

          {mode === "register" && (
            <input
              className="input"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "Iniciar sesión" : "Registrarme"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-sm text-muted hover:text-brand-500"
          >
            {mode === "login"
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
