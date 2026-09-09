import { useState } from "react";
import Modal from "../../../controls/ui/modal.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import ActionButton from "../../../controls/ui/action_button.jsx";
import { guardarMiPerfil } from "../api/perfil_cliente_api.js";
import PerfilCampos from "../perfil/perfil_campos.jsx";
export default function PerfilFormModal({ onClose, onGuardado, perfil = {} }) {
  const [data, setData] = useState({ cuit: perfil?.cuit ?? "", razon_social: perfil?.razon_social ?? "", condicion_iva: perfil?.condicion_iva ?? "", direccion: perfil?.direccion ?? "", provincia: perfil?.provincia ?? "", localidad: perfil?.localidad ?? "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const setter = (key) => (value) => setData((old) => ({ ...old, [key]: value }));
  return <Modal title="Datos de entrega y facturación" onClose={onClose} busy={busy}>
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setError("");
      if (!data.cuit.trim() || !data.direccion.trim() || !data.provincia || !data.localidad.trim()) { setError("Completá los campos obligatorios."); return; }
      setBusy(true);
      try { await guardarMiPerfil(data); await onGuardado(); }
      catch (e) { setError(e.response?.data?.mensaje || "No pudimos guardar tus datos."); }
      finally { setBusy(false); }
    }}>
      <p className="text-sm text-slate-600">Estos datos quedan guardados en tu cuenta. Podés revisarlos antes de cada pedido.</p>
      <ErrorBanner message={error} />
      <PerfilCampos cuit={data.cuit} setCuit={setter("cuit")} razonSocial={data.razon_social} setRazonSocial={setter("razon_social")}
        condicionIva={data.condicion_iva} setCondicionIva={setter("condicion_iva")} direccion={data.direccion} setDireccion={setter("direccion")}
        provincia={data.provincia} setProvincia={setter("provincia")} localidad={data.localidad} setLocalidad={setter("localidad")} />
      <ActionButton type="submit" disabled={busy} className="w-full">{busy ? "Guardando…" : "Guardar datos"}</ActionButton>
    </form>
  </Modal>;
}
