import { useState } from "react";
import { X } from "lucide-react";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { guardarMiPerfil } from "../api/perfil_cliente_api.js";
import { PROVINCIAS_ARGENTINA } from "./provincias_argentina.js";

const OPCIONES_CONDICION_IVA = [
  { value: "responsable_inscripto", label: "Responsable Inscripto" },
  { value: "monotributista", label: "Monotributista" },
  { value: "exento", label: "Exento" },
  { value: "consumidor_final", label: "Consumidor Final" },
];

/**
 * Se pide recién al enviar la primera nota de pedido, no en el registro —
 * ver nota_pedido_service.js (PERFIL_INCOMPLETO). Corto a propósito: solo
 * cuit/dirección/provincia/localidad son obligatorios.
 */
export default function PerfilFormModal({ onClose, onGuardado }) {
  const [cuit, setCuit] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [condicionIva, setCondicionIva] = useState("");
  const [direccion, setDireccion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!cuit.trim() || !direccion.trim() || !provincia || !localidad.trim()) {
      setError("Completá CUIT, dirección, provincia y localidad");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      const r = await guardarMiPerfil({
        cuit: cuit.trim(), razon_social: razonSocial.trim() || null, condicion_iva: condicionIva || null,
        direccion: direccion.trim(), provincia, localidad: localidad.trim(),
      });
      if (r?.ok === false) { setError(r.mensaje); return; }
      onGuardado();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo guardar el perfil");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Antes de enviar tu pedido</h2>
            <p className="mt-0.5 text-xs text-slate-500">Lo pedimos una sola vez — la próxima vez ya lo tenemos guardado.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <ErrorBanner message={error} />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="CUIT" required hideMessage
              tooltip="El número con guiones, ej: 20-12345678-9. Lo usamos para facturar."
              value={cuit} onChange={(e) => setCuit(e.target.value)}
              placeholder="20-12345678-9"
            />
            <SelectField
              label="Condición IVA"
              options={OPCIONES_CONDICION_IVA}
              value={condicionIva}
              onChange={(e) => setCondicionIva(e.target.value)}
              placeholder="No especificada"
            />
          </div>

          <InputField
            label="Razón social" hideMessage
            tooltip="Dejalo vacío si facturás a tu propio nombre."
            value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="(opcional)"
          />

          <InputField
            label="Dirección de entrega" required hideMessage
            tooltip="Calle, número y piso/depto si corresponde."
            value={direccion} onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Av. Siempre Viva 742"
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Provincia" required
              options={PROVINCIAS_ARGENTINA.map((p) => ({ value: p, label: p }))}
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
            />
            <InputField
              label="Localidad" required hideMessage
              value={localidad} onChange={(e) => setLocalidad(e.target.value)}
              placeholder="Ej: Rosario"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
