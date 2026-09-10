import { http } from "../../../api/http.js";
const base = "/distribuidora/importacion";
async function upload(path, file, opciones, mapeo, key) {
  const form = new FormData(); form.append("archivo", file);
  form.append("opciones", JSON.stringify(opciones));
  if (mapeo) form.append("mapeo", JSON.stringify(mapeo));
  if (key) form.append("key", key);
  return (await http.post(base + path, form, { timeout: 90000 })).data.data;
}
export const importApi = {
  preview: (file, options) => upload("/previsualizar", file, options),
  validate: (file, options, mapping, key) => upload("/validar", file, options, mapping, key),
  get: async (id) => (await http.get(base + "/" + id)).data.data,
  history: async () => (await http.get(base + "/historial")).data.data,
  batch: async (id, payload) => (await http.post(base + "/" + id + "/lote", payload, { timeout: 60000 })).data.data,
  cancel: async (id) => (await http.post(base + "/" + id + "/cancelar")).data.data,
  report: async (id) => (await http.get(base + "/" + id + "/informe", { responseType: "blob" })).data,
  template: async () => (await http.get(base + "/plantilla", { responseType: "blob" })).data,
};
