import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema } from "compartido/schemas/catalogo.js";
import Boton from "@/componentes/ui/boton.jsx";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import TextareaField from "@/componentes/ui/textarea_field.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import CategoriaSelect from "../componentes/categoria_select.jsx";
import PresentacionesEditor from "./presentaciones_editor.jsx";
import { valoresIniciales } from "./producto_form_valores.js";

const CAMPOS = ["categoria_id", "nombre", "marca", "descripcion", "activo", "publicado", "variantes"];

export default function ProductoForm({ producto, categorias, onGuardar, onCancelar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productoSchema), defaultValues: valoresIniciales(producto) });

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, CAMPOS));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-6">
      <section className="grid gap-4 rounded-2xl border border-borde bg-superficie p-5 md:grid-cols-2">
        <h2 className="text-lg font-bold md:col-span-2">Datos del producto</h2>
        <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} required />
        <CategoriaSelect label="Categoría" name="categoria_id" register={register} categorias={categorias} placeholder="Elegí una categoría" error={errors.categoria_id?.message} required />
        <InputField label="Marca" name="marca" register={register} error={errors.marca?.message} />
        <div className="md:col-span-2">
          <TextareaField label="Descripción" name="descripcion" register={register} error={errors.descripcion?.message} />
        </div>
      </section>

      <PresentacionesEditor control={control} register={register} errors={errors} />

      <section className="space-y-3 rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="text-lg font-bold">Publicación</h2>
        <CheckboxField label="Publicado" name="publicado" register={register} ayuda="Se muestra en la tienda. Destildalo para cargarlo sin que se vea todavía." />
        <CheckboxField label="Activo" name="activo" register={register} ayuda="Un producto inactivo no se vende ni se muestra, pero queda guardado." />
      </section>

      <FormError mensaje={errorGeneral} />
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCancelar} disabled={isSubmitting}>
          Cancelar
        </Boton>
        <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
          Guardar producto
        </SubmitButton>
      </div>
    </form>
  );
}
