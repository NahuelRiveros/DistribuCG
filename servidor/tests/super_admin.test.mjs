import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { diagnosticarSuperAdmin } from "../src/core/services/common/diagnostico_super_admin.js";

// El super admin se configura con SUPERADMIN_USUARIO y SUPERADMIN_CONTRASENA (el email es fijo, del core).
const config = { SUPERADMIN_USUARIO: "dueno.admin", SUPERADMIN_CONTRASENA: "ClaveInicial123" };
const hash = await bcrypt.hash(config.SUPERADMIN_CONTRASENA, 4);
function contexto({ usuario = {}, roles = ["super_admin"], configuracion = config } = {}) {
  return {
    config: configuracion,
    Usuario: { async findOne({ where }) {
      if (usuario === null || where.nombre_usuario !== configuracion.SUPERADMIN_USUARIO.trim().toLowerCase()) return null;
      return { activo: true, contrasena: hash, eliminado_en: null, ...usuario, async getRoles() { return roles.map((codigo) => ({ codigo })); } };
    } },
  };
}

test("diagnóstico admin: detecta credenciales correctas y nunca devuelve contraseña ni hash", async () => {
  const resultado = await diagnosticarSuperAdmin(contexto());
  assert.equal(resultado.codigo, "CREDENCIALES_CORRECTAS");
  assert.equal(resultado.ok, true);
  assert(!JSON.stringify(resultado).includes(config.SUPERADMIN_CONTRASENA));
  assert(!JSON.stringify(resultado).includes(hash));
  // El usuario no distingue mayúsculas ni espacios a los costados.
  assert.equal((await diagnosticarSuperAdmin(contexto({ configuracion: { ...config, SUPERADMIN_USUARIO: " Dueno.Admin " } }))).codigo, "CREDENCIALES_CORRECTAS");
});

test("diagnóstico admin: detecta la contraseña anterior conservada (el seed no la pisa)", async () => {
  const resultado = await diagnosticarSuperAdmin(contexto({ configuracion: { ...config, SUPERADMIN_CONTRASENA: "OtraClave456" } }));
  assert.equal(resultado.codigo, "CONTRASENA_DIFERENTE");
  assert.equal(resultado.ok, false);
});

test("diagnóstico admin: informa variables faltantes, cuenta ausente y estados que impiden el acceso", async () => {
  const sinUsuario = await diagnosticarSuperAdmin(contexto({ configuracion: { SUPERADMIN_USUARIO: "", SUPERADMIN_CONTRASENA: "x" } }));
  assert.equal(sinUsuario.codigo, "CONFIGURACION_INCOMPLETA");
  assert.match(sinUsuario.mensaje, /SUPERADMIN_USUARIO/);
  assert.equal((await diagnosticarSuperAdmin(contexto({ configuracion: { SUPERADMIN_USUARIO: "dueno.admin", SUPERADMIN_CONTRASENA: "" } }))).codigo, "CONFIGURACION_INCOMPLETA");
  assert.equal((await diagnosticarSuperAdmin(contexto({ usuario: null }))).codigo, "CUENTA_NO_CREADA");
  assert.equal((await diagnosticarSuperAdmin(contexto({ usuario: { activo: false } }))).codigo, "USUARIO_INACTIVO");
  assert.equal((await diagnosticarSuperAdmin(contexto({ usuario: { eliminado_en: "2026-10-01" } }))).codigo, "USUARIO_ELIMINADO");
  assert.equal((await diagnosticarSuperAdmin(contexto({ roles: ["cliente"] }))).codigo, "SIN_ROL_ADMIN");
  assert.equal((await diagnosticarSuperAdmin(contexto({ roles: ["admin"] }))).codigo, "CREDENCIALES_CORRECTAS", "admin también vale");
});
