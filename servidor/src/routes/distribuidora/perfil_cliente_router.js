import { Router } from "express";
import { obtenerMiPerfilController, guardarMiPerfilController } from "../../controllers/distribuidora/perfil_cliente_controller.js";
import { requireAuth } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

export const perfilClienteRouter = Router();
perfilClienteRouter.use(requireModuloHabilitado("eccomerce_distribuidora"));
perfilClienteRouter.use(requireAuth); // cualquier usuario logueado — siempre es SU PROPIO perfil (req.user.usuario_id)

perfilClienteRouter.get("/", obtenerMiPerfilController);
perfilClienteRouter.put("/", guardarMiPerfilController);
