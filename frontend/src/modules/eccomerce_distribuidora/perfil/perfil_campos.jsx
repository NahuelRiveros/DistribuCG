import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import { PROVINCIAS_ARGENTINA } from "../carrito/provincias_argentina.js";
import { OPCIONES_CONDICION_IVA } from "./perfil_constantes.js";

/**
 * Campos de facturación/entrega del cliente distribuidor — compartidos entre
 * el modal que se muestra antes del primer pedido (carrito/perfil_form_modal.jsx)
 * y la página "Mi perfil" (perfil/perfil_page.jsx): mismos campos, misma
 * validación visual, dos chromes distintos (modal de un solo uso vs. ABM).
 */
export default function PerfilCampos({
  cuit, setCuit,
  razonSocial, setRazonSocial,
  condicionIva, setCondicionIva,
  direccion, setDireccion,
  provincia, setProvincia,
  localidad, setLocalidad,
}) {
  return (
    <>
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
    </>
  );
}
