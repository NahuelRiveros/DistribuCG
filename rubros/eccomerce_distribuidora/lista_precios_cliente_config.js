// Actualización de precios con el Excel que exporta el sistema del cliente
// (spec docs/specs/cambios/2026-11-actualizar-precios-lista-cliente.md, PRE-30 a PRE-39).
import { limitesImportacion } from "../../core/importacion_config.js";

export const listaPreciosClienteConfig = {
  ...limitesImportacion,
  // Cambiar la versión invalida las vistas previas guardadas con reglas viejas.
  version: "precios-cliente-1",
  batchSize: 250,
  filasPorPagina: 50,
  hojaPrincipal: "LISTA",
  // Si trae un precio mayor para el mismo código, gana (PRE-33).
  hojaComparacion: "Datos Exportados",
  // Código interno del sistema del cliente: siempre 6 cifras, con ceros adelante.
  codigo: /^\d{6}$/,
  // PRE-36: variación que pide revisión y extremos que se aprueban de a uno.
  umbralRevision: 20,
  extremoSuba: 100,
  extremoBaja: 50,
  // PRE-36: parte mínima de las palabras de la lista que tienen que aparecer en el nombre del artículo.
  // Calibrado con el catálogo real (2026-11): ningún par correcto queda debajo de 0,6 y los códigos
  // reasignados dan entre 0 y 0,25.
  similitudNombreMinima: 0.4,
  // PRE-34b: meses seguidos con precio 0 en la lista para desactivar el artículo.
  mesesSinPrecio: 6,
};

// Grupos de la vista previa (PRE-35), en el orden en que se muestran.
export const GRUPOS_PRECIOS_CLIENTE = [
  { estado: "repetido", titulo: "Código repetido", decide: true, ayuda: "El código aparece más de una vez con precios distintos: elegí cuál vale." },
  { estado: "extremo", titulo: "Cambio extremo", decide: true, ayuda: `Sube más del ${listaPreciosClienteConfig.extremoSuba} % o baja más del ${listaPreciosClienteConfig.extremoBaja} %: se aprueban de a uno.` },
  { estado: "revisar", titulo: "A revisar", decide: true, ayuda: `Varía más del ${listaPreciosClienteConfig.umbralRevision} % o el nombre no se parece al del artículo.` },
  { estado: "sube", titulo: "Sube" },
  { estado: "baja", titulo: "Baja", ayuda: "Baja el precio sin marcar oferta: la oferta se carga a mano." },
  { estado: "primer_precio", titulo: "Primer precio", ayuda: "Artículos que estaban en $0." },
  { estado: "reactivar", titulo: "Vuelven a la venta", ayuda: "Se habían desactivado por estar sin precio y la lista los trae de nuevo." },
  { estado: "desactivar", titulo: "Se desactivan", ayuda: `Llevan más de ${listaPreciosClienteConfig.mesesSinPrecio} meses con precio 0 en la lista.` },
  { estado: "sin_precio", titulo: "Sin precio en la lista", ayuda: "Precio 0: dejaron de venderse. No se toca su precio." },
  { estado: "sin_cambio", titulo: "Sin cambio" },
  { estado: "no_cargado", titulo: "No están en la tienda", ayuda: "Tienen precio en la lista pero no hay un artículo con ese código." },
  { estado: "no_figura", titulo: "No figuran en la lista", ayuda: "Artículos de la tienda con código que la lista no trae." },
  { estado: "error_tienda", titulo: "Código repetido en la tienda", ayuda: "Dos artículos de la tienda tienen el mismo código: corregilo en su ficha." },
];
