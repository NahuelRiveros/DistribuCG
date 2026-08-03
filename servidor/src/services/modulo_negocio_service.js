import { ModuloNegocio } from "../models/index.js";

/** { gym: true, kinesiologia: false, ... } — usado por el frontend (nav/footer) y por el middleware. */
export async function obtenerEstadoModulos() {
  const modulos = await ModuloNegocio.findAll({ attributes: ["codigo", "habilitado"] });
  return Object.fromEntries(modulos.map((m) => [m.codigo, m.habilitado]));
}

export async function moduloNegocioHabilitado(codigo) {
  const modulo = await ModuloNegocio.findOne({ where: { codigo } });
  // Si el módulo no existe en la tabla (código mal escrito, etc.) no bloqueamos:
  // el gate solo debe restringir módulos conocidos y explícitamente apagados.
  return modulo ? modulo.habilitado : true;
}

export async function listarModulosNegocio() {
  const items = await ModuloNegocio.findAll({ order: [["codigo", "ASC"]] });
  return { ok: true, items };
}

export async function actualizarModuloNegocio(codigo, habilitado) {
  const modulo = await ModuloNegocio.findOne({ where: { codigo } });
  if (!modulo) return { ok: false, codigo: "NO_EXISTE", mensaje: "El módulo no existe" };

  await modulo.update({ habilitado: !!habilitado });
  return {
    ok: true,
    mensaje: habilitado ? "Módulo habilitado correctamente" : "Módulo deshabilitado correctamente",
    modulo,
  };
}
