import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import {
  agregarItemSchema,
  cambiarCantidadSchema,
  cotizarSchema,
  enviarPedidoSchema,
  fusionarSchema,
  itemParams,
  misPedidosQuery,
  perfilSchema,
} from "compartido/schemas/tienda.js";
import { requerirAuth, requerirModulo } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import * as tienda from "./tienda_controlador.js";
import * as pedidos from "./pedido_controlador.js";

export const tiendaRutas = Router();
tiendaRutas.use(requerirModulo("tienda"));

// Público: el carrito de un visitante se calcula sin guardar nada.
tiendaRutas.post("/carrito/cotizar", validar({ body: cotizarSchema }), tienda.cotizar);

// Con cuenta: cada usuario opera sobre SU carrito y SUS datos (nunca por id de otro).
tiendaRutas.use(requerirAuth);
tiendaRutas.get("/perfil", tienda.verPerfil);
tiendaRutas.put("/perfil", validar({ body: perfilSchema }), tienda.guardarPerfil);
tiendaRutas.get("/carrito", tienda.verCarrito);
tiendaRutas.delete("/carrito", tienda.vaciar);
tiendaRutas.post("/carrito/items", validar({ body: agregarItemSchema }), tienda.agregar);
tiendaRutas.patch("/carrito/items/:id", validar({ params: itemParams, body: cambiarCantidadSchema }), tienda.cambiarCantidad);
tiendaRutas.delete("/carrito/items/:id", validar({ params: itemParams }), tienda.quitar);
tiendaRutas.post("/carrito/fusionar", validar({ body: fusionarSchema }), tienda.fusionar);

// Pedidos del cliente (un cliente solo ve los suyos: el servicio responde 404 con los ajenos)
tiendaRutas.post("/pedidos", validar({ body: enviarPedidoSchema }), pedidos.enviar);
tiendaRutas.get("/pedidos", validar({ query: misPedidosQuery }), pedidos.mios);
tiendaRutas.get("/pedidos/:id", validar({ params: idParams }), pedidos.ver);
