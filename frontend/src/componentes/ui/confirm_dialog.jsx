import Modal from "./modal.jsx";
import Boton from "./boton.jsx";

// Adaptado de DistribuCG: ahora usa el Modal accesible.
export default function ConfirmDialog({
  abierto,
  titulo = "¿Estás seguro?",
  mensaje,
  onConfirmar,
  onCerrar,
  textoConfirmar = "Confirmar",
  peligroso = true,
  cargando = false,
}) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} ocupado={cargando} className="max-w-sm">
      {mensaje && <p className="text-sm text-texto-suave">{mensaje}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Boton>
        <Boton variante={peligroso ? "peligro" : "primario"} onClick={onConfirmar} disabled={cargando}>
          {cargando ? "Procesando..." : textoConfirmar}
        </Boton>
      </div>
    </Modal>
  );
}
