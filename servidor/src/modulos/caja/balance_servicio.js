import { proyecto } from "compartido/proyecto.js";
import { aCentavos, desdeCentavos } from "compartido/reglas/dinero.js";
import { diasDelMes, fechaTexto, hoyEn } from "compartido/reglas/fechas.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { armarPaginacion, normalizarPaginacion } from "../../nucleo/paginacion.js";

// Balance, calendario y listado de la Caja. Todos leen la misma "fuente": los movimientos
// cargados a mano + los cobros de pedidos (si la tienda está activa), unidos al consultar.
// Así un cobro anulado en el pedido desaparece solo del balance.
// Los importes se suman en la base (NUMERIC, exacto) y se pasan a centavos una sola vez.

const S = DB_SCHEMA;
const tiendaActiva = () => Boolean(proyecto.modulos.tienda);

/**
 * SQL con una fila por movimiento entre :desde y :hasta (fechas AAAA-MM-DD).
 * Los anulados manuales solo se incluyen si `conAnulados` (el listado los muestra tachados;
 * los totales nunca los suman). Los cobros anulados no aparecen: se gestionan en el pedido.
 */
function sqlFuente({ conAnulados = false } = {}) {
  const manuales = `
    SELECT 'manual' AS origen, CAST(m.id AS text) AS id, m.tipo, m.fecha, m.monto, m.categoria_id,
           c.nombre AS categoria, m.medio, m.descripcion, m.anulado_en IS NOT NULL AS anulado,
           m.motivo_anulacion, CAST(NULL AS integer) AS pedido_id, u.nombre AS registrado_por, m.creado_en
      FROM ${S}.caja_movimiento m
      JOIN ${S}.caja_categoria c ON c.id = m.categoria_id
      JOIN ${S}.usuario u ON u.id = m.registrado_por
     WHERE m.fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date)
       ${conAnulados ? "" : "AND m.anulado_en IS NULL"}`;
  if (!tiendaActiva()) return manuales;

  // El día de un cobro es el de la zona horaria del negocio (un cobro a las 23:30 no pasa al día siguiente).
  const cobros = `
    SELECT 'tienda', 'p' || CAST(pc.id AS text), 'ingreso', CAST(pc.creado_en AT TIME ZONE :zona AS date), pc.monto,
           CAST(NULL AS integer), :etiqueta_tienda, pc.metodo, 'Pedido #' || CAST(pc.pedido_id AS text), false,
           CAST(NULL AS varchar), pc.pedido_id, u.nombre, pc.creado_en
      FROM ${S}.pedido_cobro pc
      JOIN ${S}.usuario u ON u.id = pc.registrado_por
     WHERE pc.anulado_en IS NULL
       AND pc.creado_en >= (CAST(:desde AS date) + time '00:00') AT TIME ZONE :zona
       AND pc.creado_en < (CAST(:hasta AS date) + 1 + time '00:00') AT TIME ZONE :zona`;
  return `${manuales} UNION ALL ${cobros}`;
}

// Columnas que devuelve el listado (la fecha como texto AAAA-MM-DD, sin zona horaria).
const COLUMNAS = "origen, id, tipo, CAST(fecha AS text) AS fecha, monto, categoria_id, categoria, medio, descripcion, anulado, motivo_anulacion, pedido_id, registrado_por, creado_en";

const reemplazosBase = (desde, hasta) => ({ desde, hasta, zona: proyecto.zona_horaria, etiqueta_tienda: proyecto.caja.etiqueta_ventas_tienda });

async function consultar(sql, replacements) {
  return sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
}

/** { ingresos, egresos, saldo } en pesos, calculado en centavos. */
function totales(ingresosCent = 0, egresosCent = 0) {
  return { ingresos: desdeCentavos(ingresosCent), egresos: desdeCentavos(egresosCent), saldo: desdeCentavos(ingresosCent - egresosCent) };
}

/** Años con movimientos, para el selector del balance (siempre incluye el año actual). */
async function aniosDisponibles() {
  const partes = [`SELECT MIN(fecha) AS primera FROM ${S}.caja_movimiento WHERE anulado_en IS NULL`];
  if (tiendaActiva()) partes.push(`SELECT CAST(MIN(creado_en) AT TIME ZONE :zona AS date) FROM ${S}.pedido_cobro WHERE anulado_en IS NULL`);
  const filas = await consultar(`SELECT MIN(primera) AS primera FROM (${partes.join(" UNION ALL ")}) t`, { zona: proyecto.zona_horaria });
  const actual = Number(hoyEn().slice(0, 4));
  const desde = filas[0]?.primera ? Math.min(Number(String(filas[0].primera).slice(0, 4)), actual) : actual;
  return Array.from({ length: actual - desde + 1 }, (_, i) => actual - i);
}

export async function balanceAnual(anio = Number(hoyEn().slice(0, 4))) {
  const reemplazos = reemplazosBase(`${anio}-01-01`, `${anio}-12-31`);
  const [porMes, porCategoria, anios] = await Promise.all([
    consultar(`SELECT CAST(EXTRACT(MONTH FROM fecha) AS integer) AS mes, tipo, SUM(monto) AS total FROM (${sqlFuente()}) t GROUP BY 1, 2`, reemplazos),
    consultar(
      `SELECT tipo, categoria_id, categoria, origen, SUM(monto) AS total FROM (${sqlFuente()}) t
        GROUP BY tipo, categoria_id, categoria, origen ORDER BY SUM(monto) DESC, categoria`,
      reemplazos,
    ),
    aniosDisponibles(),
  ]);

  const cent = Array.from({ length: 12 }, () => ({ ingreso: 0, egreso: 0 }));
  for (const f of porMes) cent[f.mes - 1][f.tipo] += aCentavos(f.total);
  const meses = cent.map((c, i) => ({ mes: i + 1, ...totales(c.ingreso, c.egreso) }));
  const anual = cent.reduce((acc, c) => ({ ingreso: acc.ingreso + c.ingreso, egreso: acc.egreso + c.egreso }), { ingreso: 0, egreso: 0 });

  return {
    anio,
    anios,
    meses,
    totales: totales(anual.ingreso, anual.egreso),
    por_categoria: porCategoria.map((f) => ({
      tipo: f.tipo,
      categoria_id: f.categoria_id,
      categoria: f.categoria,
      origen: f.origen,
      total: desdeCentavos(aCentavos(f.total)),
    })),
  };
}

/** Totales de cada día del mes (todos los días, con 0 si no hubo nada) para el calendario. */
export async function balanceMes({ anio, mes }) {
  const ultimo = diasDelMes(anio, mes);
  const filas = await consultar(
    `SELECT CAST(fecha AS text) AS fecha, tipo, SUM(monto) AS total, COUNT(*) AS cantidad FROM (${sqlFuente()}) t GROUP BY 1, 2`,
    reemplazosBase(fechaTexto(anio, mes, 1), fechaTexto(anio, mes, ultimo)),
  );
  const porDia = new Map();
  for (const f of filas) {
    const dia = porDia.get(f.fecha) ?? { ingreso: 0, egreso: 0, cantidad: 0 };
    dia[f.tipo] += aCentavos(f.total);
    dia.cantidad += Number(f.cantidad);
    porDia.set(f.fecha, dia);
  }
  const dias = Array.from({ length: ultimo }, (_, i) => {
    const fecha = fechaTexto(anio, mes, i + 1);
    const d = porDia.get(fecha) ?? { ingreso: 0, egreso: 0, cantidad: 0 };
    return { fecha, ...totales(d.ingreso, d.egreso), cantidad: d.cantidad };
  });
  const mesCent = [...porDia.values()].reduce((acc, d) => ({ ingreso: acc.ingreso + d.ingreso, egreso: acc.egreso + d.egreso }), { ingreso: 0, egreso: 0 });
  return { anio, mes, hoy: hoyEn(), dias, totales: totales(mesCent.ingreso, mesCent.egreso) };
}

/** Listado de movimientos (manuales, incluidos los anulados, y cobros de pedidos). */
export async function listarMovimientos({ desde, hasta, tipo, categoria_id, medio, origen, pagina, limite }) {
  const pag = normalizarPaginacion({ pagina, limite, limitePorDefecto: 50 });
  const reemplazos = {
    ...reemplazosBase(desde ?? "2000-01-01", hasta ?? hoyEn()),
    tipo: tipo ?? null,
    categoria_id: categoria_id ?? null,
    medio: medio ?? null,
    origen: origen ?? null,
    limite: pag.limite,
    offset: pag.offset,
  };
  const filtrado = `SELECT * FROM (${sqlFuente({ conAnulados: true })}) t
     WHERE (CAST(:tipo AS text) IS NULL OR t.tipo = :tipo)
       AND (CAST(:categoria_id AS integer) IS NULL OR t.categoria_id = :categoria_id)
       AND (CAST(:medio AS text) IS NULL OR t.medio = :medio)
       AND (CAST(:origen AS text) IS NULL OR t.origen = :origen)`;
  const [filas, conteo] = await Promise.all([
    consultar(`SELECT ${COLUMNAS} FROM (${filtrado}) f ORDER BY f.fecha DESC, f.creado_en DESC LIMIT :limite OFFSET :offset`, reemplazos),
    consultar(`SELECT COUNT(*) AS total FROM (${filtrado}) f`, reemplazos),
  ]);
  return {
    movimientos: filas.map((f) => ({ ...f, monto: desdeCentavos(aCentavos(f.monto)) })),
    paginacion: armarPaginacion({ ...pag, total: Number(conteo[0].total) }),
  };
}

/** Todo el año sin paginar (para exportar a Excel). No incluye anulados. */
export async function movimientosDelAnio(anio) {
  const filas = await consultar(
    `SELECT ${COLUMNAS} FROM (${sqlFuente()}) t ORDER BY t.fecha, t.creado_en`,
    reemplazosBase(`${anio}-01-01`, `${anio}-12-31`),
  );
  return filas.map((f) => ({ ...f, monto: desdeCentavos(aCentavos(f.monto)) }));
}
