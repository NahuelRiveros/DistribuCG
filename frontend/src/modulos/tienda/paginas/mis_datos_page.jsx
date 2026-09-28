import { useToast } from "@/componentes/toast/toast_context.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { useGuardarPerfil, usePerfil } from "../hooks/use_tienda.js";
import DatosEntregaForm from "../componentes/datos_entrega_form.jsx";

export default function MisDatosPage() {
  const { usuario } = useAuth();
  const perfil = usePerfil();
  const guardar = useGuardarPerfil();
  const toast = useToast();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-titulos text-3xl font-bold">Mis datos</h1>
      <p className="mb-6 text-sm text-texto-suave">
        {usuario?.nombre} · {usuario?.email}. Estos datos se usan para entregar y facturar tus pedidos.
      </p>
      {perfil.isPending ? (
        <Cargando />
      ) : perfil.isError ? (
        <ErrorCarga error={perfil.error} onReintentar={perfil.refetch} />
      ) : (
        <div className="rounded-2xl border border-borde bg-superficie p-5">
          <DatosEntregaForm
            perfil={perfil.data}
            onGuardar={async (datos) => {
              await guardar.mutateAsync(datos);
              toast.exito("Datos guardados");
            }}
          />
        </div>
      )}
    </div>
  );
}
