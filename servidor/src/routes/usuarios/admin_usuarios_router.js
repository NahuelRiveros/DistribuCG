import { Router } from "express";
import { crearUsuarioController ,listarUsuariosController } from "../../controllers/usuarios/admin_usuarios_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";

export const adminUsuariosRouter = Router();

//  solo admin
adminUsuariosRouter.use(requireAuth, requireRole("staff","admin","kinesiologo"));

adminUsuariosRouter.post("/", crearUsuarioController);
adminUsuariosRouter.get("/", listarUsuariosController);