import { seed_familias_distribuidora } from "./seed_familias_distribuidora.js";
import { seed_marcas_distribuidora } from "./seed_marcas_distribuidora.js";
import { seed_productos_distribuidora } from "./seed_productos_distribuidora.js";
import { seed_catalogo_demo } from "./catalogo_demo.js";
import { seed_imagenes_catalogo } from "./imagenes_catalogo.js";
import { env } from "../../../configuracion_servidor/env.js";

// Corre después del seed del core (roles, permisos, super admin).
export async function seed_distribuidora() {
  await seed_familias_distribuidora(); // solo con el catálogo vacío
  await seed_marcas_distribuidora();   // solo sin marcas; usa las familias de arriba
  await seed_productos_distribuidora(); // solo sin artículos; usa familias y marcas existentes
  // Solo en ambientes de demostración (nunca en gc_dist): completa el catálogo y pone precios de prueba.
  if (env.CATALOGO_DEMO_AL_INICIAR) await seed_catalogo_demo();
  // Prueba y producción: fotos de Cloudinary para los artículos importados que aún no tienen.
  if (env.IMAGENES_CATALOGO_AL_INICIAR) await seed_imagenes_catalogo();
}
