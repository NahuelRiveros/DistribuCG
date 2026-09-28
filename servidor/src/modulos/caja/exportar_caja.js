import ExcelJS from "exceljs";
import { proyecto } from "compartido/proyecto.js";
import { MESES } from "compartido/reglas/fechas.js";
import { balanceAnual, movimientosDelAnio } from "./balance_servicio.js";

// Excel del año para el contador: resumen por mes, por categoría y el detalle de movimientos
// (sin los anulados). Los importes van como números, así se pueden sumar en la planilla.

const FORMATO_PESOS = '"$" #,##0.00;[Red]-"$" #,##0.00';
const TIPOS = { ingreso: "Ingreso", egreso: "Egreso" };
const etiquetaMedio = (valor) => proyecto.caja.medios.find((m) => m.valor === valor)?.etiqueta ?? valor;

function hoja(libro, nombre, columnas) {
  const h = libro.addWorksheet(nombre);
  h.columns = columnas;
  h.getRow(1).font = { bold: true };
  h.views = [{ state: "frozen", ySplit: 1 }];
  return h;
}

function filaTotal(h, valores) {
  const fila = h.addRow(valores);
  fila.font = { bold: true };
  fila.border = { top: { style: "thin" } };
}

export async function escribirExcelCaja(anio, destino) {
  const [balance, movimientos] = await Promise.all([balanceAnual(anio), movimientosDelAnio(anio)]);
  const libro = new ExcelJS.Workbook();

  const resumen = hoja(libro, `Resumen ${anio}`, [
    { header: "Mes", key: "mes", width: 14 },
    { header: "Ingresos", key: "ingresos", width: 16, style: { numFmt: FORMATO_PESOS } },
    { header: "Egresos", key: "egresos", width: 16, style: { numFmt: FORMATO_PESOS } },
    { header: "Saldo", key: "saldo", width: 16, style: { numFmt: FORMATO_PESOS } },
  ]);
  for (const m of balance.meses) resumen.addRow({ mes: MESES[m.mes - 1], ingresos: m.ingresos, egresos: m.egresos, saldo: m.saldo });
  filaTotal(resumen, { mes: "Total del año", ...balance.totales });

  const categorias = hoja(libro, "Por categoría", [
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Categoría", key: "categoria", width: 28 },
    { header: "Total", key: "total", width: 16, style: { numFmt: FORMATO_PESOS } },
  ]);
  for (const c of balance.por_categoria) categorias.addRow({ tipo: TIPOS[c.tipo], categoria: c.categoria, total: c.total });

  const detalle = hoja(libro, "Movimientos", [
    { header: "Fecha", key: "fecha", width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Categoría", key: "categoria", width: 24 },
    { header: "Descripción", key: "descripcion", width: 36 },
    { header: "Medio", key: "medio", width: 14 },
    { header: "Monto", key: "monto", width: 16, style: { numFmt: FORMATO_PESOS } },
    { header: "Registró", key: "registrado_por", width: 18 },
  ]);
  for (const m of movimientos) {
    detalle.addRow({
      // Medianoche UTC: Excel guarda fechas sin zona, así se ve el mismo día.
      fecha: new Date(`${m.fecha}T00:00:00Z`),
      tipo: TIPOS[m.tipo],
      categoria: m.categoria,
      descripcion: m.descripcion ?? "",
      medio: etiquetaMedio(m.medio),
      monto: m.tipo === "egreso" ? -m.monto : m.monto,
      registrado_por: m.registrado_por,
    });
  }

  await libro.xlsx.write(destino);
}
