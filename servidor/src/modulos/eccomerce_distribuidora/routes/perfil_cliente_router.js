import { Router } from "express";
import { obtenerMiPerfilController, guardarMiPerfilController } from "../controllers/perfil_cliente_controller.js";
import { requireAuth } from "../../../core/middleware/auth_middleware.js";

export const perfilClienteRouter = Router();
perfilClienteRouter.use(requireAuth); // cualquier usuario logueado — siempre es SU PROPIO perfil (req.user.usuario_id)

perfilClienteRouter.get("/", obtenerMiPerfilController);
perfilClienteRouter.put("/", guardarMiPerfilController);
