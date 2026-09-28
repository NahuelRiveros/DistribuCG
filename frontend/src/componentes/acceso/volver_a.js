// Traído de DistribuCG (controls/acceso/return_to.js). Evita redirecciones abiertas:
// solo se vuelve a rutas internas del sitio.
export function volverASeguro(valor, porDefecto = "/") {
  if (typeof valor !== "string" || !valor.startsWith("/") || valor.startsWith("//") || /[\\\r\n]/.test(valor)) {
    return porDefecto;
  }
  try {
    const url = new URL(valor, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || /^\/(login|registro)(\/|$)/.test(url.pathname)) return porDefecto;
    return url.pathname + url.search + url.hash;
  } catch {
    return porDefecto;
  }
}

export function linkConRetorno(ruta, volverA) {
  return `${ruta}?volver=${encodeURIComponent(volverASeguro(volverA))}`;
}
