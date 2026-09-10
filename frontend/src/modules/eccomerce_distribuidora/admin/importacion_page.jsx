import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../auth/auth_context.jsx";
import { clientConfig } from "../../../../../client_config.js";
import { catalogImportConfig, suggestMapping } from "../../../config/catalog_import_config.js";
import { importApi } from "../api/importacion_distribuidora_api.js";
import { useImportWizard } from "../../../controls/importacion/use_import_wizard.js";
import FileOptions from "../../../controls/importacion/file_options.jsx";
import ColumnMapping from "../../../controls/importacion/column_mapping.jsx";
import ImportReview from "../../../controls/importacion/import_review.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import ActionButton from "../../../controls/ui/action_button.jsx";
import Modal from "../../../controls/ui/modal.jsx";
export default function ImportacionDistribuidoraPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const wizard = useImportWizard({
    api: importApi, config: catalogImportConfig, suggestMapping,
    storageKey: clientConfig.id + ":import-profiles:" + usuario?.usuario_id,
    onComplete: () => queryClient.invalidateQueries(),
  });
  const disabled = wizard.busy || wizard.running;
  return <main className="min-h-screen bg-slate-50 px-3 py-6 sm:p-8">
    <div className="mx-auto min-w-0 max-w-6xl space-y-5">
      <div><h1 className="text-2xl font-extrabold">Importar catálogo</h1><p className="mt-1 text-sm text-slate-600">Adaptá el Excel de tu sistema, revisá los cambios y cargá productos por lotes.</p></div>
      <ErrorBanner message={wizard.error} />
      {wizard.notice && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{wizard.notice}</p>}
      {wizard.job ? <ImportReview job={wizard.job} running={wizard.running} busy={wizard.busy} skipErrors={wizard.skipErrors} onSkipErrors={wizard.setSkipErrors} onRun={wizard.run} onPause={wizard.pause} onCancel={() => setCancelOpen(true)} onBack={wizard.back} onReport={wizard.report} /> : <>
        <FileOptions config={catalogImportConfig} file={wizard.file} options={wizard.options} preview={wizard.preview} onFile={wizard.chooseFile} onOption={wizard.onOption} busy={disabled} onRead={wizard.read} onTemplate={wizard.template} />
        {wizard.preview && <ColumnMapping config={catalogImportConfig} preview={wizard.preview} mapping={wizard.mapping} options={wizard.options} onMapping={wizard.setMapping} onOption={wizard.onOption} busy={disabled} onValidate={wizard.validate} profiles={wizard.profiles} profileName={wizard.profileName} onProfileName={wizard.setProfileName} onSaveProfile={wizard.saveProfile} onProfile={wizard.applyProfile} />}
      </>}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Mis importaciones">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Mis últimas importaciones</h2><ActionButton disabled={disabled} onClick={wizard.refreshHistory}>Actualizar historial</ActionButton></div>
        <p className="text-sm text-slate-600">El progreso se guarda en el servidor. Al cerrar esta pantalla se pausa después del lote en curso; podés volver y reanudarlo.</p>
        {!wizard.history.length && <p className="text-sm text-slate-500">Todavía no hay importaciones para mostrar.</p>}
        <ul className="divide-y divide-slate-100">{wizard.history.map((job) => <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="break-all text-sm font-semibold">{job.archivo}</p><p className="text-xs text-slate-500">{new Date(job.creado_en).toLocaleString("es-AR")} · {job.estado} · {job.siguiente_lote}/{job.total_lotes} lotes</p></div>
          <ActionButton disabled={disabled} onClick={() => wizard.openJob(job.id)}>Ver importación</ActionButton>
        </li>)}</ul>
      </section>
    </div>
    {cancelOpen && <Modal title="Cancelar importación" busy={wizard.busy} onClose={() => setCancelOpen(false)}>
      <p className="mb-4 text-sm">Se detendrán los lotes pendientes. Los productos y cambios de los lotes ya guardados se conservan.</p>
      <ActionButton disabled={wizard.busy} onClick={async () => { await wizard.cancel(); setCancelOpen(false); }}>Confirmar cancelación</ActionButton>
    </Modal>}
  </main>;
}
