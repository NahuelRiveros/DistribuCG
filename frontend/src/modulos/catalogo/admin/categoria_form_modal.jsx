import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaSchema } from "compartido/schemas/catalogo.js";
import { cliente } from "@/clientes/index.js";
import Boton from "@/componentes/ui/boton.jsx";
import CheckboxField from "@/componentes/ui/checkbox_field.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Modal from "@/componentes/ui/modal.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { aplicarErroresServidor } from "@/utils/errores_formulario.js";
import CategoriaSelect from "../componentes/categoria_select.jsx";
import { idsDelSubarbol } from "../utils/arbol.js";

/**
 * Crear o editar una categoría. `categoria` = la que se edita (o null);
 * `padreInicial` = padre sugerido al crear una subcategoría.
 */
export default function CategoriaFormModal({ categoria, padreInicial = null, categorias, onGuardar, onCerrar }) {
  const [errorGeneral, setErrorGeneral] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      padre_id: String(categoria?.padre_id ?? padreInicial ?? ""),
      orden: categoria?.orden ?? 0,
      en_menu: categoria?.en_menu ?? false,
    },
  });
  // Una categoría no puede moverse adentro de sí misma ni de sus subcategorías.
  const excluir = useMemo(() => (categoria ? idsDelSubarbol(categorias, categoria.id) : null), [categoria, categorias]);

  async function enviar(datos) {
    setErrorGeneral("");
    try {
      await onGuardar(categoria ? { ...datos, id: categoria.id } : datos);
    } catch (error) {
      setErrorGeneral(aplicarErroresServidor(error, setError, ["nombre", "padre_id", "orden"]));
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={categoria ? "Editar categoría" : "Nueva categoría"} ocupado={isSubmitting}>
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
        <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} required autoFocus />
        <CategoriaSelect
          label="Dentro de"
          name="padre_id"
          register={register}
          categorias={categorias}
          excluir={excluir}
          placeholder="— Ninguna (categoría principal) —"
          error={errors.padre_id?.message}
        />
        <InputField label="Orden" name="orden" type="number" min={0} register={register} error={errors.orden?.message} ayuda="Las de menor número aparecen primero." />
        {/* Solo importa si la tienda muestra las categorías en el menú (clientes/<id>/navbar.js) */}
        {cliente.navbar.menu_productos === "categorias" && (
          <CheckboxField
            label="Mostrar en el menú de la tienda"
            name="en_menu"
            register={register}
            ayuda="Aparece arriba en la tienda, con sus subcategorías desplegables (ej. Mujer, Hombre, Calzado)."
          />
        )}
        <FormError mensaje={errorGeneral} />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando...">
            Guardar
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
