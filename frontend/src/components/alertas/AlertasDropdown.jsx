import { useState, useEffect, useRef } from "react";
import { Bell, Cake } from "lucide-react";

export default function AlertasDropdown({ hoy = [], proximos = [] }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const total = hoy.length + proximos.length;
  const hayHoy = hoy.length > 0;

  // cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* 🔔 Botón */}
      <button
        onClick={() => setAbierto(!abierto)}
        className={`relative p-2 rounded-xl transition
        ${hayHoy ? "animate-pulse bg-cyan-400/10" : "hover:bg-cyan-400/10"}`}
      >
        <Bell className="text-cyan-800" size={22} />

        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </button>

      {/* 📦 Panel */}
      {abierto && (
        <div className="absolute right-0 mt-3 w-80 bg-[#0f172a] border border-cyan-400/20 rounded-xl shadow-lg p-3 z-50 backdrop-blur">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            🎂 Cumpleaños
          </h3>

          {/* 🎉 Hoy */}
          {hoy.length > 0 && (
            <div className="mb-3">
              <p className="text-cyan-300 text-sm font-semibold mb-1">
                Hoy 🎉
              </p>
              {hoy.map((c) => (
                <div
                  key={c.persona_id}
                  className="text-sm text-white flex items-center gap-2 bg-cyan-400/10 rounded-lg px-2 py-1"
                >
                  <Cake size={14} />
                  {c.nombre} {c.apellido}
                </div>
              ))}
            </div>
          )}

          {/* 📅 Próximos */}
          {proximos.length > 0 && (
            <div>
              <p className="text-cyan-300 text-sm font-semibold mb-1">
                Próximos días
              </p>
              {proximos.map((c) => (
                <div
                  key={c.persona_id}
                  className="text-sm text-gray-300 flex justify-between px-1 py-1"
                >
                  <span>
                    {c.nombre} {c.apellido}
                  </span>
                  <span className="text-cyan-400">{c.fecha}</span>
                </div>
              ))}
            </div>
          )}

          {/* ❌ vacío */}
          {total === 0 && (
            <p className="text-gray-400 text-sm">
              No hay cumpleaños próximos
            </p>
          )}
        </div>
      )}
    </div>
  );
}