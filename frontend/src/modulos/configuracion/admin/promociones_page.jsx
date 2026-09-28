import EditorPagos from "./editor_pagos.jsx";
import SeccionCinta from "./seccion_cinta.jsx";
import SeccionPromociones from "./seccion_promociones.jsx";

export default function PromocionesPage() {
  return (
    <EditorPagos titulo="Promociones" descripcion="Promociones de bancos y el mensaje que se destaca junto al precio.">
      <SeccionPromociones />
      <SeccionCinta />
    </EditorPagos>
  );
}
