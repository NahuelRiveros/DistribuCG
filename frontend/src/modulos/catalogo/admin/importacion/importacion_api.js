import { http } from "@/api/http.js";

const BASE = "/catalogo/importacion";

async function enviarArchivo(ruta, archivo, campos) {
  const formulario = new FormData();
  formulario.append("archivo", archivo);
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor !== undefined) formulario.append(clave, typeof valor === "string" ? valor : JSON.stringify(valor));
  }
  return (await http.post(`${BASE}${ruta}`, formulario, { timeout: 90_000 })).data.data;
}

export const importacionApi = {
  previsualizar: (archivo, opciones) => enviarArchivo("/previsualizar", archivo, { opciones }),
  validar: (archivo, opciones, mapeo, id) => enviarArchivo("/validar", archivo, { opciones, mapeo, id }),
  obtener: async (id) => (await http.get(`${BASE}/${id}`)).data.data,
  historial: async () => (await http.get(`${BASE}/historial`)).data.data,
  ejecutarLote: async (id, cuerpo) => (await http.post(`${BASE}/${id}/lote`, cuerpo, { timeout: 60_000 })).data.data,
  cancelar: async (id) => (await http.post(`${BASE}/${id}/cancelar`)).data.data,
  informe: async (id) => (await http.get(`${BASE}/${id}/informe`, { responseType: "blob" })).data,
  plantilla: async () => (await http.get(`${BASE}/plantilla`, { responseType: "blob" })).data,
};
