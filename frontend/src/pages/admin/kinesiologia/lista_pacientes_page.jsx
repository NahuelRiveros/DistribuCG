import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Plus, ChevronRight, Ban, CheckCircle2, RotateCcw } from "lucide-react";
import { getPacientesKinesiologia, cambiarEstadoPacienteKinesiologia } from "../../../api/kinesiologia_api.js";
import DataGrid from "../../../components/table/DataGrid.jsx";
import AgregarPacienteModal from "./agregar_paciente_modal.jsx";

function iniciales(nombre, apellido) {
  const n = String(nombre || "").trim()[0] || "";
  const a = String(apellido || "").trim()[0] || "";
  return (a + n).toUpperCase() || "?";
}

const ESTADO_PACIENTE_LABEL = {
  en_tratamiento: "En tratamiento",
  finalizado: "Finalizado",
  recuperado: "Recuperado",
};

const ESTADO_PACIENTE_ESTILO = {
  en_tratamiento: "bg-emerald-50 text-emerald-700 border-emerald-200",
  recuperado: "bg-blue-50 text-blue-700 border-blue-200",
  finalizado: "bg-slate-50 text-slate-500 border-slate-200",
};

function EstadoPacienteBadge({ estado }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ESTADO_PACIENTE_ESTILO[estado] ?? ESTADO_PACIENTE_ESTILO.en_tratamiento}`}>
      {ESTADO_PACIENTE_LABEL[estado] ?? "En tratamiento"}
    </span>
  );
}

export default function ListaPacientesKinesiologiaPage() {
  const nav = useNavigate();

  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar({ resetPage = false, qOverride } = {}) {
    const nextPage = resetPage ? 1 : page;
    const q = qOverride !== undefined ? qOverride : busqueda;
    setCargando(true);
    setError(null);
    try {
      const r = await getPacientesKinesiologia({
        page: nextPage, limit, sort: "apellido", order: "asc",
        ...(q?.trim() ? { q: q.trim() } : {}),
      });
      if (!r?.ok) { setError(r?.mensaje || "No se pudo cargar el listado"); setData(null); return; }
      setData(r);
      if (resetPage) setPage(1);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  function handleSearch(val) {
    setBusqueda(val);
    cargar({ resetPage: true, qOverride: val });
  }

  useEffect(() => { cargar(); }, [page, limit]);

  async function cambiarEstado(row, estado) {
    if (!window.confirm(`¿Cambiar el estado de ${row.apellido} ${row.nombre} a "${ESTADO_PACIENTE_LABEL[estado]}"?`)) return;
    const r = await cambiarEstadoPacienteKinesiologia(row.paciente_kinesiologia_id, estado);
    if (r?.ok) await cargar();
  }

  const columns = [
    {
      key: "apellido",
      label: "Paciente",
      searchable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--kt-teal-700) text-[10px] font-extrabold text-white">
            {iniciales(row.nombre, row.apellido)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{row.apellido} {row.nombre}</p>
            {row.celular && <p className="text-[11px] text-slate-400 leading-tight">{row.celular}</p>}
          </div>
        </div>
      ),
    },
    { key: "documento", label: "DNI", searchable: true, className: "text-slate-600" },
    {
      key: "patologia_desc",
      label: "Patología",
      render: (row) => row.patologia_desc || <span className="text-slate-400">—</span>,
    },
    {
      key: "paciente_estado",
      label: "Estado",
      render: (row) => <EstadoPacienteBadge estado={row.paciente_estado} />,
    },
    {
      key: "_arrow",
      label: "",
      searchable: false,
      render: () => <ChevronRight size={14} className="text-slate-300" />,
      className: "text-right",
      headerClassName: "w-8",
    },
  ];

  const actions = [
    {
      key: "finalizar",
      label: "Finalizar tratamiento",
      icon: <Ban size={12} />,
      iconOnly: true,
      variant: "default",
      onClick: (row) => cambiarEstado(row, "finalizado"),
      show: (row) => row.paciente_estado === "en_tratamiento",
    },
    {
      key: "recuperado",
      label: "Marcar como recuperado",
      icon: <CheckCircle2 size={12} />,
      iconOnly: true,
      variant: "success",
      onClick: (row) => cambiarEstado(row, "recuperado"),
      show: (row) => row.paciente_estado === "en_tratamiento",
    },
    {
      key: "reactivar",
      label: "Volver a poner en tratamiento",
      icon: <RotateCcw size={12} />,
      iconOnly: true,
      variant: "primary",
      onClick: (row) => cambiarEstado(row, "en_tratamiento"),
      show: (row) => row.paciente_estado !== "en_tratamiento",
    },
  ];

  const items = data?.items || [];
  const pag = data?.pagination || { page: 1, totalPages: 1, total: 0, limit };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-[var(--kt-turquoise-border)] bg-white shadow-sm shadow-[var(--kt-turquoise)]/10">
          <div className="h-1 w-full bg-linear-to-r from-(--kt-teal-700) via-[var(--kt-petrol)] to-[var(--kt-turquoise)]" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-(--kt-teal-700) px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <HeartPulse size={11} />
                Kinesiología
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Pacientes de kinesiología</h1>
              <p className="mt-0.5 text-sm text-slate-500">{pag.total || 0} pacientes en total</p>
            </div>
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-(--kt-teal-700) px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 self-start sm:self-auto"
            >
              <Plus size={15} />
              Agregar paciente
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <DataGrid
          rows={items}
          columns={columns}
          keyField="paciente_kinesiologia_id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar por nombre, apellido o DNI…"
          onSearch={handleSearch}
          emptyMessage="Todavía no hay pacientes de kinesiología cargados."
          onRowClick={(row) => nav(`/admin/kinesiologia/${row.paciente_kinesiologia_id}`)}
          actions={actions}
          page={pag.page}
          totalPages={pag.totalPages}
          totalRows={pag.total}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          pageSize={limit}
          pageSizeOptions={[10, 20, 30, 50]}
        />

      </div>

      <AgregarPacienteModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreado={() => cargar({ resetPage: true })}
      />
    </div>
  );
}
