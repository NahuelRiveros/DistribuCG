import { useNavigate } from "react-router-dom";
import { ArrowLeft, HeartPulse, Plus, Edit2, ShieldCheck, ShieldOff } from "lucide-react";
import DataGrid from "../../../components/ui/data_grid.jsx";
import PatologiaFormModal from "../../../components/kinesiologia/patologia_form_modal.jsx";
import { useCrudPage } from "../../../hooks/use_crud_page.js";
import {
  getPatologias, crearPatologia, actualizarPatologia, cambiarEstadoPatologia,
} from "../../../api/kinesiologia_api.js";

export default function PatologiasPage() {
  const nav = useNavigate();

  const {
    items, cargando, error,
    modalAbierto, seleccionado, guardando,
    abrirNuevo, abrirEditar, cerrarModal, guardar, ejecutarAccion,
  } = useCrudPage({
    fetchFn: getPatologias,
    createFn: crearPatologia,
    updateFn: actualizarPatologia,
  });

  function toggleEstado(row) {
    const nuevoEstado = !row.activo;
    const accion = nuevoEstado ? "activar" : "desactivar";
    ejecutarAccion(() => cambiarEstadoPatologia(row.id, nuevoEstado), {
      confirmMessage: `¿Seguro que querés ${accion} "${row.descripcion}"?`,
      mensajeError: `No se pudo ${accion}`,
    });
  }

  const columns = [
    { key: "descripcion", label: "Patología", sortable: true, searchable: true, className: "font-semibold text-slate-800" },
    {
      key: "activo",
      label: "Estado",
      render: (_, val) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${val === "true" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {val === "true" ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
          {val === "true" ? "Activa" : "Inactiva"}
        </span>
      ),
    },
  ];

  const actions = [
    { key: "editar", label: "Editar", icon: <Edit2 size={12} />, variant: "primary", onClick: abrirEditar },
    { key: "desactivar", label: "Desactivar", icon: <ShieldOff size={12} />, variant: "danger", onClick: toggleEstado, show: (row) => row.activo },
    { key: "activar", label: "Activar", icon: <ShieldCheck size={12} />, variant: "success", onClick: toggleEstado, show: (row) => !row.activo },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        <button
          type="button"
          onClick={() => nav("/admin/kinesiologia")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={15} /> Volver a pacientes
        </button>

        <div className="overflow-hidden rounded-2xl border border-[var(--kt-turquoise-border)] bg-white shadow-sm">
          <div className="h-1 w-full bg-linear-to-r from-(--kt-teal-700) via-[var(--kt-petrol)] to-[var(--kt-turquoise)]" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-(--kt-teal-700) px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <HeartPulse size={11} />
                Kinesiología
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Patologías</h1>
              <p className="mt-0.5 text-sm text-slate-500">Catálogo usado al agregar un paciente de kinesiología.</p>
            </div>
            <button
              type="button"
              onClick={abrirNuevo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 self-start sm:self-auto"
            >
              <Plus size={15} /> Nueva patología
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <DataGrid
          rows={items}
          columns={columns}
          keyField="id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar patología…"
          emptyMessage="No hay patologías cargadas."
          actions={actions}
          pageSize={20}
          pageSizeOptions={[10, 20, 50]}
        />

      </div>

      <PatologiaFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardar}
        patologiaEditar={seleccionado}
        cargando={guardando}
      />
    </div>
  );
}
