import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import Boton from "@/componentes/ui/boton.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";

const IDENTIDADES = [
  { valor: "sku", etiqueta: "Código / SKU (recomendado)" },
  { valor: "nombre", etiqueta: "Categoría + nombre + presentación" },
];
const DECIMALES = [
  { valor: "coma", etiqueta: "Coma decimal: 1.234,56" },
  { valor: "punto", etiqueta: "Punto decimal: 1,234.56" },
];
const TIPOS_PRECIO = [
  { valor: "neto", etiqueta: "Es neto, sin IVA" },
  { valor: "final", etiqueta: "Ya incluye IVA" },
];

export default function PasoColumnas({ asistente, deshabilitado }) {
  const { vista, mapeo, opciones, cambiarOpcion } = asistente;
  const columnas = vista.columnas.map((c) => ({ valor: c.clave, etiqueta: c.etiqueta }));

  return (
    <section aria-labelledby="paso-2" className="min-w-0 space-y-5 rounded-2xl border border-borde bg-superficie p-5">
      <div>
        <h2 id="paso-2" className="text-lg font-bold">
          2. Indicá qué es cada columna
        </h2>
        <p className="text-sm text-texto-suave">
          {vista.total.toLocaleString("es-AR")} filas encontradas. Las columnas con títulos conocidos ya están asignadas: revisalas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {config.campos.map((campo) => (
          <SelectField
            key={campo.clave}
            label={campo.etiqueta}
            name={`columna_${campo.clave}`}
            opciones={columnas}
            placeholder="— No importar —"
            value={mapeo[campo.clave] ?? ""}
            onChange={(e) => asistente.asignarColumna(campo.clave, e.target.value)}
            disabled={deshabilitado}
            title={campo.ayuda}
          />
        ))}
      </div>

      <div className="grid gap-4 border-t border-borde pt-4 sm:grid-cols-2">
        <SelectField label="Qué hacer" name="modo" opciones={config.modos} value={opciones.modo} onChange={(e) => cambiarOpcion("modo", e.target.value)} disabled={deshabilitado} />
        <SelectField label="Reconocer productos existentes por" name="identidad" opciones={IDENTIDADES} value={opciones.identidad} onChange={(e) => cambiarOpcion("identidad", e.target.value)} disabled={deshabilitado} />
        <SelectField label="El precio del archivo" name="tipo_precio" opciones={TIPOS_PRECIO} value={opciones.tipo_precio} onChange={(e) => cambiarOpcion("tipo_precio", e.target.value)} disabled={deshabilitado} />
        <SelectField label="Formato de los números" name="decimal" opciones={DECIMALES} value={opciones.decimal} onChange={(e) => cambiarOpcion("decimal", e.target.value)} disabled={deshabilitado} />
        <InputField label="IVA para productos nuevos sin IVA (%)" name="iva_por_defecto" type="number" min={0} max={100} step="0.01" value={opciones.iva_por_defecto} onChange={(e) => cambiarOpcion("iva_por_defecto", e.target.value)} disabled={deshabilitado} />
        <InputField label="Categoría si el archivo no la trae" name="categoria_por_defecto" placeholder="Ej: Almacén > Galletitas" value={opciones.categoria_por_defecto} onChange={(e) => cambiarOpcion("categoria_por_defecto", e.target.value)} disabled={deshabilitado} />
      </div>

      {opciones.identidad === "nombre" && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Sin código, cambiar un nombre en el archivo crea un producto nuevo. La categoría es obligatoria.</p>
      )}

      <fieldset className="space-y-2 rounded-xl bg-fondo p-4" disabled={deshabilitado || opciones.modo === "crear"}>
        <legend className="text-sm font-bold">En los productos que ya existen, actualizar:</legend>
        <div className="flex flex-wrap gap-5">
          {config.camposActualizables.map(({ valor, etiqueta }) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={opciones.actualizar.includes(valor)}
                onChange={(e) => cambiarOpcion("actualizar", e.target.checked ? [...opciones.actualizar, valor] : opciones.actualizar.filter((v) => v !== valor))}
              />
              {etiqueta}
            </label>
          ))}
        </div>
        <p className="text-sm text-texto-suave">El nombre, la marca, la descripción, la categoría y las imágenes de lo que ya existe no se modifican.</p>
      </fieldset>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-borde" tabIndex={0} aria-label="Muestra del archivo">
        <table className="w-full text-left text-sm">
          <caption className="p-3 text-left font-semibold">Primeras {vista.filas.length} filas del archivo</caption>
          <thead className="bg-fondo">
            <tr>
              <th className="p-2">Fila</th>
              {vista.columnas.map((c) => (
                <th key={c.clave} className="whitespace-nowrap p-2">
                  {c.nombre || "Sin título"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vista.filas.map((f) => (
              <tr key={f.numero} className="border-t border-borde">
                <td className="p-2 text-texto-suave">{f.numero}</td>
                {vista.columnas.map((c, i) => (
                  <td key={c.clave} className="max-w-60 truncate p-2" title={String(f.valores[i] ?? "")}>
                    {String(f.valores[i] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Boton onClick={asistente.validar} disabled={deshabilitado || !vista.total}>
        {asistente.ocupado ? "Revisando todas las filas..." : "Revisar sin cargar nada"}
      </Boton>
    </section>
  );
}
