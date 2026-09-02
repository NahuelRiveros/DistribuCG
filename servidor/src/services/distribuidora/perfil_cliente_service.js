import { PerfilClienteDistribuidora } from "../../models/index.js";

export async function obtenerPerfil(usuario_id) {
  return PerfilClienteDistribuidora.findOne({ where: { usuario_id } });
}

/**
 * Requerido para poder enviar una nota de pedido (ver nota_pedido_service.js).
 * razon_social y condicion_iva son opcionales a propósito — cuit/direccion/
 * provincia/localidad son los únicos 4 campos que de verdad hacen falta
 * para poder facturar y entregar.
 */
export function perfilCompleto(perfil) {
  return !!(perfil && perfil.cuit && perfil.direccion && perfil.provincia && perfil.localidad);
}

export async function guardarPerfil(usuario_id, { cuit, razon_social = null, condicion_iva = null, direccion, provincia, localidad }) {
  const [perfil] = await PerfilClienteDistribuidora.findOrCreate({
    where: { usuario_id },
    defaults: { usuario_id, cuit, razon_social, condicion_iva, direccion, provincia, localidad },
  });
  await perfil.update({ cuit, razon_social, condicion_iva, direccion, provincia, localidad, fecha_mod: new Date() });
  return perfil;
}
