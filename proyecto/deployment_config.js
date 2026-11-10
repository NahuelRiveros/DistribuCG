// Direcciones públicas de esta instalación. No incluir secretos.
export const deploymentConfig = {
  nombre: "DistribuCG",
  backendUrl: "https://distribucg.onrender.com",
  frontendUrl: "https://distribu-cg.vercel.app",
  // Carpeta de este proyecto en Cloudinary (la cuenta se comparte con otros proyectos).
  carpetaCloudinary: "distribucg",
  // Backends de proyectos anteriores: el build falla si VITE_API_URL todavía apunta a uno.
  backendsAnteriores: ["dynamic-gym.onrender.com"],
};
