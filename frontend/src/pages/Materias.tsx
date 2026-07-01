import { motion } from "framer-motion";
import { useSubjects } from "@/hooks/useTutor";

export function Materias() {
  const { data: subjects, isLoading } = useSubjects();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Materias</h1>
        <p className="text-sm text-muted">Todo el temario preuniversitario en un solo lugar.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {subjects?.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: s.color ?? "#6366f1" }}
              >
                <span className="text-lg font-bold">{s.name[0]}</span>
              </div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted">Explorar temas →</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
