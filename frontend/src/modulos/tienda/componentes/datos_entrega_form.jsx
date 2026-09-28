import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PROVINCIAS } from "compartido/datos/provincias.js";
import { CONDICIONES_IVA, perfilSchema } from "compartido/schemas/tienda.js";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";

const CAMPOS = ["telefono", "direccion", "localidad", "provincia", "codigo_postal", "indicaciones", "razon_social", "cuit", "condicion_iva"];

/** Datos de entrega y facturación del cliente. Se usa en "Mis datos" y al enviar el pedido. */
export default function DatosEntregaForm({ perfil, onGuardar, textoBoton = "Guardar" }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(perfilSchema),
    defaultValues: Object.fromEntries(CAMPOS.map((c) => [c, perfil?.[c] ?? ""])),
  });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, CAMPOS));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Teléfono" name="telefono" type="tel" autoComplete="tel" register={register} error={errors.telefono?.message} required />
        <InputField label="Dirección" name="direccion" autoComplete="street-address" register={register} error={errors.direccion?.message} required />
        <InputField label="Localidad" name="localidad" autoComplete="address-level2" register={register} error={errors.localidad?.message} required />
        <SelectField label="Provincia" name="provincia" register={register} opciones={PROVINCIAS.map((p) => ({ valor: p, etiqueta: p }))} placeholder="Elegí una provincia" error={errors.provincia?.message} required />
        <InputField label="Código postal" name="codigo_postal" autoComplete="postal-code" register={register} error={errors.codigo_postal?.message} />
        <InputField label="Indicaciones para la entrega" name="indicaciones" placeholder="Ej: portón verde, horario de 8 a 12" register={register} error={errors.indicaciones?.message} />
      </div>

      <details className="rounded-xl bg-fondo p-4" open={Boolean(perfil?.cuit || perfil?.razon_social)}>
        <summary className="cursor-pointer text-sm font-semibold">Datos para la factura (opcional)</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <InputField label="Razón social" name="razon_social" register={register} error={errors.razon_social?.message} />
          <InputField label="CUIT" name="cuit" inputMode="numeric" placeholder="20-12345678-9" register={register} error={errors.cuit?.message} />
          <SelectField label="Condición frente al IVA" name="condicion_iva" register={register} opciones={CONDICIONES_IVA} placeholder="—" error={errors.condicion_iva?.message} />
        </div>
      </details>

      <FormError mensaje={errorGeneral} />
      <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
        {textoBoton}
      </SubmitButton>
    </form>
  );
}
