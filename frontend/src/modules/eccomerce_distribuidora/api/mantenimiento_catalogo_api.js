import { http } from "../../../core/api/http.js";

const base = "/distribuidora/mantenimiento/catalogo";
const dato = (r) => r.data.data;

export const FRASE_LIMPIAR = "BORRAR ARTÍCULOS";

export const mantenimientoCatalogoApi = {
  estado: async () => dato(await http.get(base)),
  copia: async () => (await http.get(base + "/copia", { responseType: "blob", timeout: 60000 })).data,
  limpiar: async () => dato(await http.post(base + "/limpiar", { confirmacion: FRASE_LIMPIAR }, { timeout: 120000 })),
  cargarLote: async (lote) => dato(await http.post(base + "/cargar", { lote }, { timeout: 120000 })),
};
