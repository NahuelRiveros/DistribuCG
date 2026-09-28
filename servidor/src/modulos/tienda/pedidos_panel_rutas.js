import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import { anularCobroSchema, cambiarEstadoSchema, cobroParams, cobroSchema, listarPedidosQuery } from "compartido/schemas/tienda.js";
import { requerirAuth, requerirModulo, requerirRol } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import * as pedidos from "./pedido_controlador.js";

// Gestión de pedidos desde el panel (/api/pedidos). Cada cambio guarda quién lo hizo.
export const pedidosPanelRutas = Router();
pedidosPanelRutas.use(requerirModulo("tienda"), requerirAuth, requerirRol("admin", "staff"));

pedidosPanelRutas.get("/", validar({ query: listarPedidosQuery }), pedidos.listar);
pedidosPanelRutas.get("/resumen", pedidos.resumen);
pedidosPanelRutas.get("/:id", validar({ params: idParams }), pedidos.ver);
pedidosPanelRutas.patch("/:id/estado", validar({ params: idParams, body: cambiarEstadoSchema }), pedidos.cambiarEstado);
pedidosPanelRutas.post("/:id/cobros", validar({ params: idParams, body: cobroSchema }), pedidos.registrarCobro);
pedidosPanelRutas.post("/:id/cobros/:cobroId/anular", validar({ params: cobroParams, body: anularCobroSchema }), pedidos.anularCobro);
