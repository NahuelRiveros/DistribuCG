import { Router } from "express";
import { listaAlumnos , detalleAlumno , alumnosCumples, profesoresGym, asignarProfesor } from "../../controllers/gym/lista_alumnos_controller.js";

export const listaAlumnosRouter = Router ();
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

listaAlumnosRouter.use(requireAuth, requireModuloHabilitado("gym"), requireRole("staff","admin","profesional"));
listaAlumnosRouter.get("/listado", listaAlumnos);
listaAlumnosRouter.get("/detalle/:id", detalleAlumno);
listaAlumnosRouter.get("/cumples", alumnosCumples);
listaAlumnosRouter.get("/profesores", profesoresGym);
listaAlumnosRouter.patch("/:id/profesor", asignarProfesor);
