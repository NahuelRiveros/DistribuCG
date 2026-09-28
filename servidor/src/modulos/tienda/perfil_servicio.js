import { pick } from "../../nucleo/consultas.js";
import { PerfilCliente } from "./modelos.js";

const CAMPOS = ["telefono", "direccion", "localidad", "provincia", "codigo_postal", "indicaciones", "razon_social", "cuit", "condicion_iva"];

export async function obtenerPerfil(usuario_id, { transaction } = {}) {
  const perfil = await PerfilCliente.findOne({ where: { usuario_id }, attributes: CAMPOS, transaction });
  return perfil?.get({ plain: true }) ?? null;
}

/** Crea o reemplaza los datos de entrega. Los pedidos ya enviados guardan su propia copia. */
export async function guardarPerfil(usuario_id, datos) {
  const valores = { ...Object.fromEntries(CAMPOS.map((c) => [c, null])), ...pick(datos, CAMPOS) };
  const [perfil] = await PerfilCliente.findOrCreate({ where: { usuario_id }, defaults: { usuario_id, ...valores } });
  await perfil.update(valores);
  return obtenerPerfil(usuario_id);
}
