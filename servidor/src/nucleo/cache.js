// Cache-Control para lecturas públicas (catálogo, configuración de pagos). Render no tiene CDN
// para la API: el ahorro es en el navegador del visitante, que no vuelve a pedir lo mismo
// durante unos segundos. Con sesión (admin, cliente) la respuesta puede ser distinta: no se comparte.
export function cachePublico({ segundos = 30, revalidar = 120 } = {}) {
  return (req, res, next) => {
    res.vary("Authorization");
    res.set(
      "Cache-Control",
      req.headers.authorization ? "private, no-cache" : `public, max-age=${segundos}, stale-while-revalidate=${revalidar}`,
    );
    next();
  };
}
