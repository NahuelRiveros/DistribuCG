import { proyecto } from "compartido/proyecto.js";

export const presentacionVacia = () => ({
  nombre: "",
  sku: "",
  precio: "",
  precio_anterior: "",
  iva_porcentaje: proyecto.catalogo.iva_por_defecto,
  activo: true,
});

/** Valores del formulario a partir de un producto del API (o vacíos para uno nuevo). */
export function valoresIniciales(producto) {
  if (!producto) {
    return { categoria_id: "", nombre: "", marca: "", descripcion: "", activo: true, publicado: true, variantes: [presentacionVacia()] };
  }
  return {
    categoria_id: String(producto.categoria_id),
    nombre: producto.nombre,
    marca: producto.marca ?? "",
    descripcion: producto.descripcion ?? "",
    activo: producto.activo,
    publicado: producto.publicado,
    // id, atributos y controla_stock no tienen campo visible, pero viajan igual al guardar.
    variantes: producto.variantes.map((v) => ({
      id: v.id,
      nombre: v.nombre ?? "",
      sku: v.sku ?? "",
      precio: v.precio,
      precio_anterior: v.precio_anterior ?? "",
      iva_porcentaje: Number(v.iva_porcentaje),
      activo: v.activo,
      atributos: v.atributos ?? {},
      controla_stock: v.controla_stock,
    })),
  };
}
