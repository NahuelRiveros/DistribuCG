// Direcciones públicas de esta instalación. No incluir secretos.
export const deploymentConfig = {
  nombre: "DistribuCG",
  backendUrl: "https://distribucg.onrender.com",
  frontendUrl: "https://distribu-cg.vercel.app",
  // Carpeta de este proyecto en Cloudinary (la cuenta se comparte con otros proyectos).
  carpetaCloudinary: "distribucg",
  // Esquema de la base de producción (BD_ESQUEMA en Render). Ahí nunca se cargan precios de demostración
  // y la PC no puede usarlo como esquema local. Desde 2026-11-19 es dcdist (antes gc_dist).
  esquemaProduccion: "dcdist",
  // Backends de proyectos anteriores: el build falla si VITE_API_URL todavía apunta a uno.
  backendsAnteriores: ["dynamic-gym.onrender.com"],
};
