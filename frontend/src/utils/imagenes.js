// Cloudinary entrega cada foto en el tamaño y formato justos si se le pide en la dirección.
// Pocos anchos fijos a propósito: cada variante distinta consume cuota del plan la primera vez.
export const ANCHOS = { miniatura: 160, tarjeta: 480, detalle: 1000 };

const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Dirección de la imagen con ese ancho máximo (solo las de Cloudinary; las demás quedan igual). */
export function urlImagen(url, ancho) {
  const partes = typeof url === "string" ? url.match(CLOUDINARY) : null;
  if (!partes || !ancho) return url;
  return `${partes[1]}c_limit,w_${ancho},f_auto,q_auto/${partes[2]}`;
}
