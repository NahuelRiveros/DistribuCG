import { http } from "../../../core/api/http.js";

const base = "/distribuidora/precios-cliente";
const dato = (r) => r.data.data;

export const preciosClienteApi = {
  validar: async (archivo, key) => {
    const form = new FormData();
    form.append("archivo", archivo);
    form.append("key", key);
    return dato(await http.post(base + "/validar", form, { timeout: 90000 }));
  },
  historial: async () => dato(await http.get(base + "/historial")),
  detalle: async (id) => dato(await http.get(`${base}/${id}`)),
  filas: async (id, { estado, pagina, buscar }) => dato(await http.get(`${base}/${id}/filas`, { params: { estado, pagina, buscar: buscar || undefined } })),
  decidir: async (id, cuerpo) => dato(await http.post(`${base}/${id}/decisiones`, cuerpo)),
  lote: async (id, cuerpo) => dato(await http.post(`${base}/${id}/lote`, cuerpo, { timeout: 60000 })),
  cancelar: async (id) => dato(await http.post(`${base}/${id}/cancelar`)),
  deshacer: async (id) => dato(await http.post(`${base}/${id}/deshacer`, {}, { timeout: 60000 })),
  informe: async (id) => (await http.get(`${base}/${id}/informe`, { responseType: "blob" })).data,
};
