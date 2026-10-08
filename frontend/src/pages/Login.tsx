import { m } from "framer-motion";
import { Brain, Eye, EyeOff, Lightbulb, Loader2, Lock, Mail, Users, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { TukuOwl } from "@/components/TukuOwl";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { apiError } from "@/lib/api";

const PROMISES = [
  { icon: Lightbulb, text: "Tus ideas primero: Tuku no te da la respuesta." },
  { icon: Brain, text: "Preguntas que hacen crecer tu cerebro." },
  { icon: Users, text: "Aprende a ver las cosas desde otros ojos." },
];

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  // Credenciales demo precargadas solo en desarrollo local.
  const [email, setEmail] = useState(import.meta.env.DEV ? "estudiante@preu.pe" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "estudiante123" : "");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(apiError(err, "No se pudo entrar. Revisa tu correo y contraseña."));
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Panel de Tuku */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 text-2xl font-black">Tuku</div>
        <div className="space-y-6">
          <TukuOwl mood="wave" size={150} />
          <h1 className="text-4xl font-black leading-tight">
            ¡Hola! Soy Tuku.
            <br />
            Juntos aprendemos a pensar.
          </h1>
          <ul className="space-y-3">
            {PROMISES.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-lg font-semibold text-brand-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <p.icon size={20} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm font-semibold text-brand-100">
          Pensamiento crítico para niñas y niños de 1.º a 6.º de primaria · "Tuku" es búho en quechua
        </p>
      </div>

      {/* Formulario */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8">
        <m.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card w-full max-w-sm space-y-4 p-6 sm:p-8"
        >
          <div className="flex flex-col items-center gap-1 text-center lg:hidden">
            <TukuOwl mood="wave" size={88} />
            <p className="text-2xl font-black">Tuku</p>
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-black">
              {mode === "login" ? "¡Qué bueno verte otra vez!" : "Crea tu cuenta"}
            </h2>
            <p className="text-sm text-muted">
              {mode === "login" ? "Entra para seguir pensando con Tuku." : "Pide ayuda a un adulto si la necesitas."}
            </p>
          </div>

          {mode === "register" && (
            <Field icon={UserRound} label="Nombre">
              <input
                className="input pl-11"
                placeholder="¿Cómo te llamas?"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Field>
          )}
          <Field icon={Mail} label="Correo">
            <input
              className="input pl-11"
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field icon={Lock} label="Contraseña">
            <input
              className="input pl-11 pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:bg-brand-500/10 hover:text-brand-600"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </Field>

          {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" className="btn-primary w-full !min-h-[52px] !text-lg" disabled={loading}>
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === "login" ? "Entrar" : "Crear mi cuenta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-sm font-bold text-muted hover:text-brand-600"
          >
            {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
          </button>
        </m.form>
        <Footer className="mt-4" />
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-bold">{label}</span>
      <span className="relative block">
        <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        {children}
      </span>
    </label>
  );
}
