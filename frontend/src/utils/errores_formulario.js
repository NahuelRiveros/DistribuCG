import { mensajeDeError } from "@/api/http.js";

/**
 * Lleva los errores del servidor ({ detalles: [{ campo, mensaje }] }) a los campos
 * del formulario (React Hook Form). Devuelve el mensaje general para mostrar arriba.
 */
export function aplicarErroresServidor(error, setError, camposDelFormulario) {
  const detalles = error?.response?.data?.detalles ?? [];
  let alguno = false;
  for (const { campo, mensaje } of detalles) {
    const raiz = campo.split(".")[0];
    if (camposDelFormulario.includes(raiz)) {
      setError(campo, { type: "servidor", message: mensaje });
      alguno = true;
    }
  }
  return alguno ? "Revisá los campos marcados." : mensajeDeError(error);
}
