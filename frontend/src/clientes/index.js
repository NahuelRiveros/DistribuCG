import { proyecto } from "compartido/proyecto.js";

// Cada carpeta de clientes/ exporta { cliente } desde su index.js.
// Sumar un cliente = copiar la carpeta demo/ y cambiar proyecto.config.js → cliente.
const disponibles = import.meta.glob("./*/index.js", { eager: true });
const modulo = disponibles[`./${proyecto.cliente}/index.js`];

if (!modulo) {
  throw new Error(
    `No existe frontend/src/clientes/${proyecto.cliente}/. Clientes disponibles: ` +
      Object.keys(disponibles).map((ruta) => ruta.split("/")[1]).join(", "),
  );
}

export const cliente = modulo.cliente;

/** Nombre de la sección de productos para el comprador (clientes/<id>/navbar.js → productos). */
export const nombreProductos = cliente.navbar.productos ?? "Productos";
export const verProductos = `Ver ${nombreProductos.toLowerCase()}`;
