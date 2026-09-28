import { Download, FileSpreadsheet } from "lucide-react";
import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import Boton from "@/componentes/ui/boton.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";

const SEPARADORES = [
  { valor: "auto", etiqueta: "Detectar solo" },
  { valor: ";", etiqueta: "Punto y coma (;)" },
  { valor: ",", etiqueta: "Coma (,)" },
  { valor: "\t", etiqueta: "Tabulación" },
];
const CODIFICACIONES = [
  { valor: "utf-8", etiqueta: "UTF-8" },
  { valor: "windows-1252", etiqueta: "Windows-1252 (Excel viejo)" },
];

export default function PasoArchivo({ asistente, deshabilitado }) {
  const { archivo, opciones, vista, cambiarOpcion } = asistente;
  const hojas = vista?.hojas ?? [];

  return (
    <section aria-labelledby="paso-1" className="space-y-4 rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="paso-1" className="text-lg font-bold">
          1. Elegí el archivo
        </h2>
        <Boton variante="secundario" tamano="chico" onClick={asistente.descargarPlantilla} disabled={deshabilitado}>
          <Download className="h-4 w-4" aria-hidden="true" /> Descargar plantilla Excel
        </Boton>
      </div>
      <p className="text-sm text-texto-suave">
        Excel (.xlsx) o CSV de hasta {config.maxMb} MB y {config.maxFilas.toLocaleString("es-AR")} filas. Una fila por presentación. Puede ser la lista de precios de tu sistema o de un proveedor.
      </p>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-borde p-6 text-center hover:border-primario">
        <FileSpreadsheet className="h-8 w-8 text-texto-suave" aria-hidden="true" />
        <span className="font-semibold">{archivo ? archivo.name : "Elegir archivo .xlsx o .csv"}</span>
        <input type="file" accept=".xlsx,.csv" className="sr-only" disabled={deshabilitado} onChange={(e) => asistente.elegirArchivo(e.target.files?.[0] ?? null)} aria-label="Archivo a importar" />
      </label>

      <details className="rounded-xl bg-fondo p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Opciones de lectura (si el archivo no se lee bien)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hojas.length > 1 ? (
            <SelectField label="Hoja" name="hoja" opciones={hojas} value={opciones.hoja} onChange={(e) => cambiarOpcion("hoja", Number(e.target.value))} disabled={deshabilitado} />
          ) : (
            <InputField label="Número de hoja" name="hoja" type="number" min={1} value={opciones.hoja} onChange={(e) => cambiarOpcion("hoja", Number(e.target.value))} disabled={deshabilitado} />
          )}
          <InputField label="Fila de títulos" name="fila_encabezado" type="number" min={1} max={50} value={opciones.fila_encabezado} onChange={(e) => cambiarOpcion("fila_encabezado", Number(e.target.value))} disabled={deshabilitado} />
          <SelectField label="Separador (CSV)" name="separador" opciones={SEPARADORES} value={opciones.separador} onChange={(e) => cambiarOpcion("separador", e.target.value)} disabled={deshabilitado} />
          <SelectField label="Codificación (CSV)" name="codificacion" opciones={CODIFICACIONES} value={opciones.codificacion} onChange={(e) => cambiarOpcion("codificacion", e.target.value)} disabled={deshabilitado} />
        </div>
      </details>

      <Boton onClick={asistente.leer} disabled={!archivo || deshabilitado}>
        {asistente.ocupado && !vista ? "Leyendo..." : "Leer archivo"}
      </Boton>
    </section>
  );
}
