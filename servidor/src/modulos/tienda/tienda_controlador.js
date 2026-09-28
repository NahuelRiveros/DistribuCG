import * as carrito from "./carrito_servicio.js";
import * as perfil from "./perfil_servicio.js";

export const verPerfil = async (req, res) => res.json({ ok: true, data: await perfil.obtenerPerfil(req.usuario.id) });
export const guardarPerfil = async (req, res) => res.json({ ok: true, data: await perfil.guardarPerfil(req.usuario.id, req.datos.body) });

export const verCarrito = async (req, res) => res.json({ ok: true, data: await carrito.verCarrito(req.usuario.id) });
export const agregar = async (req, res) => res.status(201).json({ ok: true, data: await carrito.agregarItem(req.usuario.id, req.datos.body) });
export const cambiarCantidad = async (req, res) =>
  res.json({ ok: true, data: await carrito.cambiarCantidad(req.usuario.id, req.datos.params.id, req.datos.body.cantidad) });
export const quitar = async (req, res) => res.json({ ok: true, data: await carrito.quitarItem(req.usuario.id, req.datos.params.id) });
export const vaciar = async (req, res) => res.json({ ok: true, data: await carrito.vaciarCarrito(req.usuario.id) });
export const fusionar = async (req, res) => res.json({ ok: true, data: await carrito.fusionarCarrito(req.usuario.id, req.datos.body) });
export const cotizar = async (req, res) => res.json({ ok: true, data: await carrito.cotizar(req.datos.body.items) });
