// Los links de la config de un cliente pueden ser internos ("/", "/#contacto") o externos.
// Solo se aceptan protocolos conocidos: nunca "javascript:" ni similares.

export function esInterno(href) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

export function esExternoSeguro(href) {
  return typeof href === "string" && /^(https?:|mailto:|tel:)/i.test(href);
}
