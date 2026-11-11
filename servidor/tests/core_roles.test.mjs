import test from "node:test";
import assert from "node:assert/strict";
import { nombreRol, permisosConfig } from "../../core/permisos_config.js";

test("PER-14: los roles del sistema se muestran con nombres profesionales, sin 'admin' a la vista", () => {
  assert.equal(nombreRol("super_admin"), "Administrador del sistema");
  assert.equal(nombreRol("admin"), "Gerente general");
  assert.equal(nombreRol("supervisor"), "Encargado");
  for (const nombre of Object.values(permisosConfig.nombresRol)) assert.doesNotMatch(nombre, /\b(super ?)?admin\b/i);
});

test("PER-14: todo rol que el programa usa por código tiene nombre visible", () => {
  for (const codigo of [...permisosConfig.rolesTotales, ...permisosConfig.rolesFuera]) {
    assert.ok(permisosConfig.nombresRol[codigo], codigo);
  }
});

test("PER-14: un rol creado en el panel se muestra legible", () => {
  assert.equal(nombreRol("repositor_de_gondola"), "Repositor de gondola");
  assert.equal(nombreRol(undefined), "");
});
