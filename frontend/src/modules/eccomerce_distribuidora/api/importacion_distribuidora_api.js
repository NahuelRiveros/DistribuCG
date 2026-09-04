import { http } from "../../../api/http.js";

// FormData: no fijar Content-Type a mano — axios/el browser arman el
// boundary del multipart solos si se lo dejamos detectar automáticamente.

export async function previsualizarImportacion(file) {
  const formData = new FormData();
  formData.append("archivo", file);
  const { data } = await http.post("/distribuidora/importacion/previsualizar", formData);
  return data;
}

export async function ejecutarImportacion(file, mapeo) {
  const formData = new FormData();
  formData.append("archivo", file);
  formData.append("mapeo", JSON.stringify(mapeo));
  const { data } = await http.post("/distribuidora/importacion/ejecutar", formData);
  return data;
}
