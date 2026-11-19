// Lista de precios del sistema del cliente (PRE-31 a PRE-37): de las filas crudas del Excel a un
// plan por código. Sin base de datos: recibe lo cargado en la tienda y devuelve qué hacer con cada fila.
import { listaPreciosClienteConfig as config } from "../../../../../../rubros/eccomerce_distribuidora/lista_precios_cliente_config.js";

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Fecha de hoy en Argentina, "AAAA-MM-DD" (la de las fechas de negocio). */
export const hoyArgentina = (fecha = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(fecha);

/** "006021  ", "\"006021" o "'006021" → "006021". Solo texto: un precio numérico nunca se toma como código. */
export function codigoCliente(valor) {
  if (typeof valor !== "string") return null;
  const limpio = valor.replace(/["'\s]/g, "");
  return config.codigo.test(limpio) ? limpio : null;
}

/** Vacío, espacios, texto o negativo valen 0 (sin precio). Redondeado al centavo. */
export function precioCliente(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) && valor > 0 ? redondear(valor) : 0;
  const texto = String(valor ?? "").trim();
  if (!/^\d+([.,]\d+)?$/.test(texto)) return 0;
  return redondear(Number(texto.replace(",", ".")));
}

/** Cada fila puede traer varios grupos código · descripción · precio (la hoja LISTA trae dos). */
export function extraerPrecios(filas) {
  const salida = [];
  for (const { numero, valores } of filas) {
    for (let i = 0; i < valores.length; i++) {
      const cod = codigoCliente(valores[i]);
      if (!cod) continue;
      salida.push({ cod, descripcion: String(valores[i + 1] ?? "").replace(/\s+/g, " ").trim(), precio: precioCliente(valores[i + 2]), fila: numero });
      i += 2;
    }
  }
  return salida;
}

const PALABRAS_VACIAS = new Set(["con", "sin", "para", "por", "los", "las", "del", "de", "la", "el", "y"]);
const palabras = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .split(/[^a-z]+/).filter((p) => p.length >= 3 && !PALABRAS_VACIAS.has(p));

/**
 * Parte de las palabras de la descripción de la lista que aparecen en el nombre del artículo.
 * Compara por prefijo porque la lista abrevia ("Butt.Toff." ↔ "Butter Toffees").
 */
export function similitudNombre(descripcionLista, nombreTienda) {
  const lista = palabras(descripcionLista), tienda = palabras(nombreTienda);
  if (!lista.length || !tienda.length) return 1;
  const coincide = (p) => tienda.some((t) => t.startsWith(p) || p.startsWith(t));
  return lista.filter(coincide).length / lista.length;
}

const agrupar = (filas) => {
  const mapa = new Map();
  for (const f of filas) { if (!mapa.has(f.cod)) mapa.set(f.cod, []); mapa.get(f.cod).push(f); }
  return mapa;
};

/** "2026-11-19" menos n meses, en fecha de calendario (sin horas). */
export function restarMeses(fechaISO, meses) {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1 - meses, 1));
  const ultimoDia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)).getUTCDate();
  fecha.setUTCDate(Math.min(d, ultimoDia));
  return fecha.toISOString().slice(0, 10);
}

/**
 * Plan de la actualización. `variantes`: presentaciones vigentes de la tienda con código del cliente,
 * con los datos de su artículo. `codigosDeBaja`: códigos que la tienda tiene dados de baja.
 * Devuelve una fila por código de la lista más una por artículo de la tienda que la lista no trae.
 */
export function armarPlanPrecios({ lista, comparacion = [], variantes, codigosDeBaja = new Set(), hoy }) {
  const porCodigo = agrupar(lista);
  const comparados = agrupar(comparacion.filter((f) => f.precio > 0));
  const tienda = agrupar(variantes.map((v) => ({ ...v, cod: v.cod_ref })));
  const porArticulo = new Map();
  for (const v of variantes) { if (!porArticulo.has(v.producto_id)) porArticulo.set(v.producto_id, []); porArticulo.get(v.producto_id).push(v); }
  const limiteSinPrecio = restarMeses(hoy, config.mesesSinPrecio);
  const filas = [];

  for (const [cod, deLista] of porCodigo) {
    const base = { cod, descripcion: deLista[0].descripcion, filasExcel: deLista.map((f) => f.fila) };
    const enTienda = tienda.get(cod) ?? [];
    if (enTienda.length > 1) { filas.push({ ...base, estado: "error_tienda", precioLista: deLista[0].precio }); continue; }
    const variante = enTienda[0];

    // PRE-37: el mismo código con precios distintos no se aplica hasta que alguien elige.
    const precios = [...new Set(deLista.map((f) => f.precio))];
    const deComparacion = [...new Set((comparados.get(cod) ?? []).map((f) => f.precio))];
    if (precios.length > 1) {
      if (!variante) { filas.push({ ...base, estado: "no_cargado", precioLista: Math.max(...precios), mensaje: "Código repetido en la lista." }); continue; }
      const opciones = [];
      for (const f of deLista) {
        if (!opciones.some((o) => o.precio === f.precio && o.descripcion === f.descripcion)) opciones.push({ precio: f.precio, descripcion: f.descripcion, fila: f.fila, origen: config.hojaPrincipal });
      }
      if (deComparacion.length === 1 && !opciones.some((o) => o.precio === deComparacion[0])) opciones.push({ precio: deComparacion[0], descripcion: comparados.get(cod)[0].descripcion, fila: comparados.get(cod)[0].fila, origen: config.hojaComparacion });
      filas.push({ ...base, ...datosVariante(variante), estado: "repetido", opciones });
      continue;
    }

    // PRE-33: gana el mayor de las dos hojas, solo entre precios mayores que 0.
    let precio = precios[0], origen = config.hojaPrincipal;
    if (precio > 0 && deComparacion.length === 1 && deComparacion[0] > precio) { precio = deComparacion[0]; origen = config.hojaComparacion; }

    if (!variante) {
      if (precio > 0) filas.push({ ...base, estado: "no_cargado", precioLista: precio, origen, mensaje: codigosDeBaja.has(cod) ? "Dado de baja en la tienda." : undefined });
      continue;
    }
    filas.push(planDeVariante({ ...base, ...datosVariante(variante), origen }, variante, precio, { hoy, limiteSinPrecio, variantesDelArticulo: porArticulo.get(variante.producto_id), porCodigo }));
  }

  for (const v of variantes) {
    if (!porCodigo.has(v.cod_ref)) filas.push({ cod: v.cod_ref, estado: "no_figura", ...datosVariante(v) });
  }
  return filas;
}

const datosVariante = (v) => ({
  variedadId: v.id, productoId: v.producto_id, articulo: [v.producto_nombre, v.nombre].filter(Boolean).join(" · "),
  marca: v.marca ?? null, precioAntes: Number(v.precio),
  sinPrecioAntes: v.sin_precio_lista_desde ?? null, activoAntes: Boolean(v.producto_activo), inactivoPorListaAntes: Boolean(v.inactivo_por_lista),
});

/** Estado y cambios de una presentación con un precio ya resuelto (también se usa al elegir entre repetidos). */
export function planDeVariante(fila, variante, precio, { hoy, limiteSinPrecio = restarMeses(hoy, config.mesesSinPrecio), variantesDelArticulo = [variante], porCodigo = new Map(), sinRevision = false } = {}) {
  const antes = Number(variante.precio);
  if (precio === 0) {
    // PRE-34: el precio no se toca; se anota desde cuándo la lista lo trae en 0.
    const desde = variante.sin_precio_lista_desde ?? hoy;
    // PRE-34b: se desactiva el artículo cuando todas sus presentaciones llevan el plazo sin precio.
    const todasViejas = variantesDelArticulo.every((v) => {
      const deLista = porCodigo.get(v.cod_ref);
      const sinPrecio = v.id === variante.id || (deLista && deLista.every((f) => f.precio === 0));
      const fecha = v.id === variante.id ? desde : v.sin_precio_lista_desde;
      return sinPrecio && fecha && fecha <= limiteSinPrecio;
    });
    const desactivar = todasViejas && variante.producto_activo && !variante.inactivo_por_lista;
    return { ...fila, estado: desactivar ? "desactivar" : "sin_precio", precioLista: 0, precioNuevo: antes, sinPrecioDespues: desde, accionProducto: desactivar ? "desactivar" : null };
  }
  const reactivar = !variante.producto_activo && variante.inactivo_por_lista;
  const cambios = { precioLista: precio, precioNuevo: precio, sinPrecioDespues: null, accionProducto: reactivar ? "reactivar" : null };
  if (antes === precio) return { ...fila, ...cambios, estado: reactivar ? "reactivar" : "sin_cambio", variacion: 0 };
  if (antes === 0) return { ...fila, ...cambios, estado: reactivar ? "reactivar" : "primer_precio", variacion: null };
  const variacion = Math.round((precio / antes - 1) * 1000) / 10;
  const nombre = similitudNombre(fila.descripcion, [variante.producto_nombre, variante.marca, variante.nombre].filter(Boolean).join(" "));
  const motivos = [];
  if (Math.abs(variacion) > config.umbralRevision) motivos.push("variacion");
  if (nombre < config.similitudNombreMinima) motivos.push("nombre");
  const extremo = variacion > config.extremoSuba || variacion < -config.extremoBaja;
  const estado = sinRevision ? (reactivar ? "reactivar" : variacion > 0 ? "sube" : "baja")
    : extremo ? "extremo" : motivos.length ? "revisar" : reactivar ? "reactivar" : variacion > 0 ? "sube" : "baja";
  return { ...fila, ...cambios, estado, variacion, motivos };
}

/** Estados que necesitan una decisión antes de aplicarse (PRE-36, PRE-37). */
export const ESTADOS_CON_DECISION = new Set(["revisar", "extremo", "repetido"]);
/** Estados que no cambian nada en la tienda: solo se informan. */
export const ESTADOS_INFORMATIVOS = new Set(["sin_cambio", "no_cargado", "no_figura", "error_tienda"]);

/**
 * Lo que efectivamente se aplica de una fila según la decisión tomada; null si no cambia nada.
 * `decision`: "aprobar", "excluir" u "opcion:N" (para repetidos).
 */
export function cambioAAplicar(fila, decision, { hoy }) {
  if (ESTADOS_INFORMATIVOS.has(fila.estado)) return null;
  if (fila.estado === "repetido") {
    const elegida = /^opcion:(\d+)$/.exec(decision ?? "");
    const opcion = elegida && fila.opciones[Number(elegida[1])];
    if (!opcion) return null;
    const variante = {
      id: fila.variedadId, producto_id: fila.productoId, precio: fila.precioAntes, sin_precio_lista_desde: fila.sinPrecioAntes,
      producto_activo: fila.activoAntes, inactivo_por_lista: fila.inactivoPorListaAntes,
    };
    // Quien eligió ya revisó: no vuelve a pedir aprobación. El plazo de PRE-34b se cuenta en la próxima lista.
    return cambioAAplicar(planDeVariante({ ...fila, opciones: undefined, origen: opcion.origen }, variante, opcion.precio, { hoy, limiteSinPrecio: "0000-00-00", sinRevision: true }), "aprobar", { hoy });
  }
  if ((fila.estado === "revisar" || fila.estado === "extremo") && decision !== "aprobar") return null;
  const cambiaPrecio = fila.precioNuevo !== fila.precioAntes;
  const cambiaFecha = (fila.sinPrecioDespues ?? null) !== (fila.sinPrecioAntes ?? null);
  if (!cambiaPrecio && !cambiaFecha && !fila.accionProducto) return null;
  return {
    variedadId: fila.variedadId, productoId: fila.productoId, precioAntes: fila.precioAntes, precioNuevo: fila.precioNuevo,
    sinPrecioAntes: fila.sinPrecioAntes ?? null, sinPrecioDespues: fila.sinPrecioDespues ?? null,
    accionProducto: fila.accionProducto ?? null, activoAntes: fila.activoAntes, inactivoPorListaAntes: fila.inactivoPorListaAntes,
  };
}

export function resumirPlan(filas) {
  const resumen = { total: filas.length };
  for (const f of filas) resumen[f.estado] = (resumen[f.estado] ?? 0) + 1;
  return resumen;
}
