/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Traído de DistribuCG (controls/toast/toast_context.jsx).
const ToastContext = createContext(null);

const ESTILOS = {
  exito: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const mostrar = useCallback((tipo, mensaje) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setAvisos((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), 3500);
  }, []);

  const valor = useMemo(
    () => ({
      exito: (mensaje) => mostrar("exito", mensaje),
      error: (mensaje) => mostrar("error", mensaje),
      info: (mensaje) => mostrar("info", mensaje),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div aria-live="polite" className="fixed right-4 top-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {avisos.map((a) => (
          <div key={a.id} role={a.tipo === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${ESTILOS[a.tipo]}`}>
            {a.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error("useToast tiene que usarse dentro de <ToastProvider>");
  return contexto;
}
