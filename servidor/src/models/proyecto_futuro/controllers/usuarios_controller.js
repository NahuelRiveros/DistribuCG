import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario,
  reactivarUsuario,
  asignarRolesUsuario,
  agregarRolUsuario,
  quitarRolUsuario,
  resetearPasswordUsuario,
  obtenerPerfil,
} from "../services/usuarios_service.js";

export async function crearUsuarioController(req, res) {
  try {
    const result = await crearUsuario(req.body);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("crearUsuarioController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al crear usuario" });
  }
}

export async function listarUsuariosController(req, res) {
  try {
    const data = await listarUsuarios(req.user.email);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("listarUsuariosController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al listar usuarios" });
  }
}

export async function obtenerUsuarioController(req, res) {
  try {
    const usuario = await obtenerUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    return res.json({ ok: true, data: usuario });
  } catch (error) {
    console.error("obtenerUsuarioController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener usuario" });
  }
}

export async function actualizarUsuarioController(req, res) {
  try {
    const result = await actualizarUsuario(req.params.id, req.body);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("actualizarUsuarioController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al actualizar usuario" });
  }
}

export async function eliminarUsuarioController(req, res) {
  try {
    const result = await eliminarUsuario(req.params.id);
    if (!result.ok) return res.status(404).json(result);
    return res.json(result);
  } catch (error) {
    console.error("eliminarUsuarioController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al desactivar usuario" });
  }
}

export async function reactivarUsuarioController(req, res) {
  try {
    const result = await reactivarUsuario(req.params.id);
    if (!result.ok) return res.status(404).json(result);
    return res.json(result);
  } catch (error) {
    console.error("reactivarUsuarioController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al reactivar usuario" });
  }
}

// ==========================================================
// GESTIÓN DE ROLES
// ==========================================================

// PUT /usuarios/:id/roles  — reemplaza TODOS los roles activos
// Body: { roles: ["ADM", "STF"] }
export async function asignarRolesController(req, res) {
  try {
    const { roles } = req.body ?? {};
    if (!roles) return res.status(400).json({ ok: false, mensaje: 'El campo "roles" (array) es requerido' });

    const result = await asignarRolesUsuario(req.params.id, roles);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("asignarRolesController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al asignar roles", detalle: error.message });
  }
}

// POST /usuarios/:id/roles/:abreviatura  — agrega un rol sin quitar los existentes
export async function agregarRolController(req, res) {
  try {
    const result = await agregarRolUsuario(req.params.id, req.params.abreviatura);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("agregarRolController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al agregar rol" });
  }
}

// DELETE /usuarios/:id/roles/:abreviatura  — revoca un rol (soft delete)
export async function quitarRolController(req, res) {
  try {
    const result = await quitarRolUsuario(req.params.id, req.params.abreviatura);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("quitarRolController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al quitar rol" });
  }
}

// PUT /usuarios/:id/password  — admin resetea password sin conocer la actual
export async function resetearPasswordController(req, res) {
  try {
    const { password } = req.body ?? {};
    if (!password) return res.status(400).json({ ok: false, mensaje: 'El campo "password" es requerido' });

    const result = await resetearPasswordUsuario(req.params.id, password);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error("resetearPasswordController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al resetear contraseña" });
  }
}

// GET /usuarios/perfil  — usuario ve su propio perfil desde DB (más fresco que /auth/me)
export async function perfilController(req, res) {
  try {
    const usuario = await obtenerPerfil(req.user.usuario_id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    return res.json({ ok: true, data: usuario });
  } catch (error) {
    console.error("perfilController:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener perfil" });
  }
}
